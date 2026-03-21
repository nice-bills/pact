import { Command } from "commander";
import { poolCreate, poolJoin, poolStatus, poolSync, poolStreamOpen } from "./commands/pool.js";
import { claimSubmit, claimList, claimApprove, claimReject } from "./commands/claim.js";

const program = new Command();

program
  .name("mutual-aid")
  .description("Mutual Aid Pool CLI — ERC-8183 claims, Safe multisig, Superfluid streams")
  .version("0.1.0");

const poolCmd = program
  .command("pool")
  .description("Pool management commands");

poolCmd
  .command("create")
  .description("Deploy a new MutualAidPool Safe and register with ERC-8183")
  .requiredOption("--name <name>", "Pool name")
  .requiredOption("--threshold <n>", "Multisig threshold", Number)
  .requiredOption("--members <addresses>", "Comma-separated founding member addresses")
  .action(poolCreate);

poolCmd
  .command("join")
  .description("Join an existing pool as a new member")
  .requiredOption("--pool <address>", "Pool Safe address")
  .requiredOption("--voucher <address>", "Address of member who vouches for you")
  .action(poolJoin);

poolCmd
  .command("status")
  .description("Show pool status, members, and balance")
  .requiredOption("--pool <address>", "Pool Safe address")
  .action(poolStatus);

poolCmd
  .command("sync")
  .description("Sync all member stream statuses onchain")
  .requiredOption("--pool <address>", "Pool Safe address")
  .action(poolSync);

poolCmd
  .command("stream-open")
  .description("Open a Superfluid stream to the pool")
  .requiredOption("--pool <address>", "Pool Safe address")
  .requiredOption("--flow-rate <rate>", "Monthly contribution in USD", Number)
  .action(poolStreamOpen);

const claimCmd = program
  .command("claim")
  .description("Claim management commands");

claimCmd
  .command("submit")
  .description("Submit a new claim to the pool")
  .requiredOption("--pool <address>", "Pool Safe address")
  .requiredOption("--amount <usd>", "Amount in USD", Number)
  .requiredOption("--evidence <ipfs-hash>", "IPFS hash of evidence")
  .requiredOption("--description <text>", "Claim description")
  .action(claimSubmit);

claimCmd
  .command("list")
  .description("List all claims on a pool")
  .requiredOption("--pool <address>", "Pool Safe address")
  .option("--status <status>", "Filter by status (open|submitted|funded|completed|rejected|expired)")
  .action(claimList);

claimCmd
  .command("approve")
  .description("Approve a claim (multisig)")
  .requiredOption("--pool <address>", "Pool Safe address")
  .requiredOption("--claim-id <id>", "Claim ID", Number)
  .action(claimApprove);

claimCmd
  .command("reject")
  .description("Reject a claim (multisig)")
  .requiredOption("--pool <address>", "Pool Safe address")
  .requiredOption("--claim-id <id>", "Claim ID", Number)
  .action(claimReject);

program.parse();
