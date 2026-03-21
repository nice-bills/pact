import type { AgentRecommendation, ClaimSubmission } from "../core/types.js";
import { RPC_URL } from "../core/config.js";

const MINIMAX_API_URL = "https://api.minimax.io/v1/text/chatcompletion_v2";

interface MiniMaxResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

interface GenLayerEvaluation {
  approve: boolean;
  confidence: number;
  reasoning: string;
}

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

function parseEvaluationResponse(content: string): AgentRecommendation {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      approve: false,
      confidence: 0,
      reasoning: `Could not parse evaluation response: ${content.slice(0, 100)}`,
      evaluatedAt: Date.now(),
    };
  }
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      approve: Boolean(parsed.approve),
      confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 50)),
      reasoning: String(parsed.reasoning || "No reasoning provided"),
      evaluatedAt: Date.now(),
    };
  } catch {
    return {
      approve: false,
      confidence: 0,
      reasoning: `Malformed JSON in evaluation response: ${content.slice(0, 100)}`,
      evaluatedAt: Date.now(),
    };
  }
}

async function evaluateViaGenLayerIC(
  submission: ClaimSubmission,
  icAddress: string
): Promise<AgentRecommendation> {
  const response = await fetch(`${RPC_URL}/evaluate_claim`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      address: icAddress,
      method: "evaluate_claim",
      args: {
        claim_id: `${submission.claimantAddress}-${Date.now()}`,
        claimant_address: submission.claimantAddress,
        amount_usd: submission.amountUsd,
        description: submission.description,
        evidence_ipfs_hash: submission.evidenceIpfsHash,
      },
    }),
  });
  if (!response.ok) {
    throw new Error(`GenLayer IC error: ${response.status}`);
  }
  const data = await response.json() as GenLayerEvaluation;
  return {
    approve: data.approve,
    confidence: data.confidence,
    reasoning: data.reasoning,
    evaluatedAt: Date.now(),
  };
}

async function evaluateViaMiniMax(
  messages: Array<{ role: "system" | "user"; content: string }>,
  apiKey: string
): Promise<AgentRecommendation> {
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
  const data = await response.json() as MiniMaxResponse;
  const content = data.choices?.[0]?.message?.content ?? "";
  return parseEvaluationResponse(content);
}

async function evaluateViaFallbackUrl(
  messages: Array<{ role: "system" | "user"; content: string }>,
  apiKey: string
): Promise<AgentRecommendation> {
  const response = await fetch(process.env.CLAIM_EVALUATOR_URL!, {
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
  const data = await response.json() as MiniMaxResponse;
  const content = data.choices?.[0]?.message?.content ?? "";
  return parseEvaluationResponse(content);
}

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

  const evalUrl = process.env.CLAIM_EVALUATOR_URL;
  const genLayerAddress = process.env.GENLAYER_IC_ADDRESS;

  if (genLayerAddress) {
    try {
      return await evaluateViaGenLayerIC(submission, genLayerAddress);
    } catch (error) {
      console.warn(`GenLayer IC evaluation failed, trying fallback: ${error}`);
    }
  }

  if (evalUrl) {
    try {
      return await evaluateViaFallbackUrl(messages, apiKey);
    } catch (error) {
      console.warn(`Fallback evaluator URL failed, trying MiniMax direct: ${error}`);
    }
  }

  try {
    return await evaluateViaMiniMax(messages, apiKey);
  } catch (error) {
    console.error("All evaluation methods failed, flagging for manual review:", error);
    return {
      approve: false,
      confidence: 0,
      reasoning: `Evaluation unavailable: ${error instanceof Error ? error.message : String(error)}. Claim flagged for manual committee review — will not auto-deny.`,
      evaluatedAt: Date.now(),
    };
  }
}
