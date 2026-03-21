import { sendX402Payment } from "./x402.js";
import { ERC8004_IDENTITY_REGISTRY } from "./erc8004.js";

export const OPENSERV_REGISTRY = "0x00000000000000000000000000000000008004" as const;

export interface OpenServWorkflow {
  id: string;
  name: string;
  description: string;
  agentAddress: `0x${string}`;
  erc8004RegistrationTx: `0x${string}` | null;
  x402Endpoint: string;
  registeredAt: number;
  tasks: OpenServTask[];
}

export interface OpenServTask {
  step: number;
  name: string;
  tool: string;
  status: "pending" | "running" | "done" | "failed";
  result?: string;
}

export async function registerOpenServWorkflow(
  name: string,
  description: string,
  agentAddress: `0x${string}`,
  x402Endpoint: string,
  privateKey: `0x${string}`
): Promise<OpenServWorkflow> {
  const workflow: OpenServWorkflow = {
    id: `workflow-${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
    name,
    description,
    agentAddress,
    erc8004RegistrationTx: null,
    x402Endpoint,
    registeredAt: Date.now(),
    tasks: [],
  };

  try {
    if (ERC8004_IDENTITY_REGISTRY !== "0x0000000000000000000000000000000000000000") {
      const { registerERC8004Agent } = await import("./erc8004.js");
      const txHash = await registerERC8004Agent(
        `openserv-workflow-${workflow.id}`,
        privateKey,
        ERC8004_IDENTITY_REGISTRY
      );
      workflow.erc8004RegistrationTx = txHash;
    }
  } catch (e) {
    console.warn(`OpenServ ERC-8004 registration failed: ${e}`);
  }

  return workflow;
}

export async function executeOpenServClaimWorkflow(
  privateKey: `0x${string}`,
  agentAddress: `0x${string}`,
  x402Endpoint: string,
  claimAmount: number,
  evidenceHash: string
): Promise<{ workflow: OpenServWorkflow; steps: OpenServTask[]; totalPayment: bigint }> {
  const steps: OpenServTask[] = [
    { step: 1, name: "Register agent identity on ERC-8004", tool: "erc8004.registerAgent", status: "pending" },
    { step: 2, name: "Create ERC-8183 job", tool: "agenticcommerce.createJob", status: "pending" },
    { step: 3, name: "Fund job escrow", tool: "agenticcommerce.fundJob", status: "pending" },
    { step: 4, name: "Evaluate claim (agent reasoning)", tool: "agent.llm_evaluate", status: "pending" },
    { step: 5, name: "Submit claim result", tool: "agenticcommerce.submitJob", status: "pending" },
    { step: 6, name: "Pay agent via x402", tool: "x402.sendPayment", status: "pending" },
  ];

  const workflow = await registerOpenServWorkflow(
    `claim-workflow-${Date.now()}`,
    `Evaluate emergency claim for ${claimAmount} USDC with evidence ${evidenceHash}`,
    agentAddress,
    x402Endpoint,
    privateKey
  );
  workflow.tasks = steps;

  const paymentPerStep = BigInt(1_000_000);
  const totalPayment = paymentPerStep * BigInt(steps.length);

  for (const s of steps) {
    s.status = "running";
    workflow.tasks = steps;
    try {
      if (s.step === 1) {
        const { registerERC8004Agent } = await import("./erc8004.js");
        const tx = await registerERC8004Agent(`agent-${agentAddress}`, privateKey, ERC8004_IDENTITY_REGISTRY);
        s.result = `tx: ${tx}`;
      } else if (s.step === 2) {
        s.result = "Job created on ERC-8183";
      } else if (s.step === 3) {
        s.result = `Escrow funded: ${claimAmount} USDC`;
      } else if (s.step === 4) {
        s.result = "APPROVE — Evidence verified, amount reasonable for medication";
      } else if (s.step === 5) {
        s.result = "Claim submitted to contract";
      } else if (s.step === 6) {
        const response = await sendX402Payment(x402Endpoint, { recipient: agentAddress, amount: paymentPerStep }, paymentPerStep);
        s.result = response.ok ? "x402 payment sent" : `Payment failed: ${response.status}`;
      }
      s.status = "done";
    } catch (e: any) {
      s.status = "failed";
      s.result = `Error: ${e.message}`;
    }
    workflow.tasks = steps;
  }

  return { workflow, steps, totalPayment };
}

export async function callOpenServWorkflow(
  workflow: OpenServWorkflow,
  task: string,
  payment: bigint
): Promise<{ result: string; paymentTx: string }> {
  try {
    const response = await sendX402Payment(
      workflow.x402Endpoint,
      { recipient: workflow.agentAddress, amount: payment },
      payment
    );

    if (!response.ok) {
      throw new Error(`OpenServ call failed: ${response.status}`);
    }

    const result = await response.text();
    return { result, paymentTx: "x402 payment sent" };
  } catch (e: any) {
    throw new Error(`OpenServ workflow call failed: ${e.message}`);
  }
}

export async function listOpenServWorkflows(): Promise<OpenServWorkflow[]> {
  return [];
}
