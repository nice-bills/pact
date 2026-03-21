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
  } catch (e) {
    throw new Error(`OpenServ workflow call failed: ${e}`);
  }
}

export async function listOpenServWorkflows(): Promise<OpenServWorkflow[]> {
  return [];
}
