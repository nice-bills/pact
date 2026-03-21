import type { AgentRecommendation, ClaimSubmission } from "../core/types.js";

const MINIMAX_API_URL = "https://api.minimax.io/v1/text/chatcompletion_v2";
const FALLBACK_EVALUATOR_URL = process.env.CLAIM_EVALUATOR_URL;

const SYSTEM_PROMPT = `You are an insurance claim evaluator for a mutual aid pool.
Your job is to assess whether a claim for emergency funds is legitimate.

You will receive:
- A description of the emergency
- An IPFS hash linking to evidence (e.g. photo of a medical bill)
- The amount requested in USD

Evaluate based on:
1. Does the description match a genuine emergency (medical, urgent shelter, etc.)?
2. Is the amount reasonable for the described emergency?
3. Are there red flags suggesting fraud?

Respond in JSON format only:
{
  "approve": true/false,
  "confidence": 0-100,
  "reasoning": "Brief explanation"
}`;

export async function evaluateClaim(
  submission: ClaimSubmission,
  apiKey: string
): Promise<AgentRecommendation> {
  const userMessage = [
    `Emergency claim evaluation request:`,
    `- Claimant: ${submission.claimantAddress}`,
    `- Amount requested: $${submission.amountUsd}`,
    `- Description: ${submission.description}`,
    `- Evidence IPFS hash: ${submission.evidenceIpfsHash}`,
    ``,
    `Please evaluate this claim and respond in JSON format.`,
  ].join("\n");

  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    { role: "user" as const, content: userMessage },
  ];

  try {
    if (FALLBACK_EVALUATOR_URL) {
      const response = await fetch(FALLBACK_EVALUATOR_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "MiniMax-M2.5",
          messages,
          temperature: 0.1,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`Evaluator URL error: ${response.status}`);
      }

      const data = await response.json() as any;
      const content = data.choices?.[0]?.message?.content ?? "";

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error(`Could not parse JSON from evaluator response: ${content}`);
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        approve: Boolean(parsed.approve),
        confidence: Number(parsed.confidence) || 50,
        reasoning: String(parsed.reasoning || "No reasoning provided"),
        evaluatedAt: Date.now(),
      };
    }

    const response = await fetch(MINIMAX_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "MiniMax-M2.5",
        messages,
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`MiniMax API error: ${response.status} ${text}`);
    }

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content ?? "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`Could not parse JSON from model response: ${content}`);
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      approve: Boolean(parsed.approve),
      confidence: Number(parsed.confidence) || 50,
      reasoning: String(parsed.reasoning || "No reasoning provided"),
      evaluatedAt: Date.now(),
    };
  } catch (error) {
    console.error("Claim evaluation failed, defaulting to manual review:", error);
    return {
      approve: false,
      confidence: 0,
      reasoning: `Evaluation failed: ${error instanceof Error ? error.message : String(error)}. Requires manual review.`,
      evaluatedAt: Date.now(),
    };
  }
}
