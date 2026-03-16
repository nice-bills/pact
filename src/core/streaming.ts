import { Framework } from "@superfluid-finance/sdk-core";
import { ethers } from "ethers";

export interface StreamConfig {
  rpcUrl: string;
  privateKey: string;
  superTokenAddress: string;
  recipientAddress: string;
  flowRatePerMonth: number; // in token units (e.g. 5 USDC)
}

function monthlyToFlowRate(amountPerMonth: number, decimals: number): string {
  const amountPerSecond = amountPerMonth / (30 * 24 * 60 * 60);
  const weiPerSecond = ethers.utils.parseUnits(amountPerSecond.toFixed(18), decimals);
  return weiPerSecond.toString();
}

export async function openContributionStream(config: StreamConfig): Promise<string> {
  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
  const signer = new ethers.Wallet(config.privateKey, provider);
  const chainId = (await provider.getNetwork()).chainId;

  const sf = await Framework.create({
    chainId,
    provider,
  });

  const flowRate = monthlyToFlowRate(config.flowRatePerMonth, 18); // USDCx has 18 decimals

  const createFlowOp = sf.cfaV1.createFlow({
    sender: await signer.getAddress(),
    receiver: config.recipientAddress,
    superToken: config.superTokenAddress,
    flowRate,
  });

  const txResponse = await createFlowOp.exec(signer);
  const receipt = await txResponse.wait();

  console.log(`Stream opened: ${flowRate} wei/sec to ${config.recipientAddress}`);
  console.log(`TX: ${receipt.transactionHash}`);

  return receipt.transactionHash;
}

export async function closeContributionStream(config: Omit<StreamConfig, "flowRatePerMonth">): Promise<string> {
  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
  const signer = new ethers.Wallet(config.privateKey, provider);
  const chainId = (await provider.getNetwork()).chainId;

  const sf = await Framework.create({
    chainId,
    provider,
  });

  const deleteFlowOp = sf.cfaV1.deleteFlow({
    sender: await signer.getAddress(),
    receiver: config.recipientAddress,
    superToken: config.superTokenAddress,
  });

  const txResponse = await deleteFlowOp.exec(signer);
  const receipt = await txResponse.wait();

  console.log(`Stream closed to ${config.recipientAddress}`);
  console.log(`TX: ${receipt.transactionHash}`);

  return receipt.transactionHash;
}

export async function getStreamInfo(
  rpcUrl: string,
  senderAddress: string,
  receiverAddress: string,
  superTokenAddress: string
): Promise<{ flowRate: string; active: boolean }> {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const chainId = (await provider.getNetwork()).chainId;

  const sf = await Framework.create({
    chainId,
    provider,
  });

  const flow = await sf.cfaV1.getFlow({
    superToken: superTokenAddress,
    sender: senderAddress,
    receiver: receiverAddress,
    providerOrSigner: provider,
  });

  return {
    flowRate: flow.flowRate,
    active: flow.flowRate !== "0",
  };
}
