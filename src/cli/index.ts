import { Command } from "commander";
import { poolCreate, poolJoin, poolStatus, poolSync, poolStreamOpen } from "./commands/pool.js";
import { claimSubmit, claimList, claimApprove, claimReject } from "./commands/claim.js";
import { serve } from "./commands/serve.js";

const program = new Command();

program
  .name("mutual-aid")
  .description("Mutual Aid Pool CLI — ERC-8183 claims, Safe multisig, Superfluid streams")
  .version("0.1.0");

program
  .command("pool create")
  .description("Deploy a new MutualAidPool Safe and register with ERC-8183")
  .requiredOption("--name <name>", "Pool name")
  .requiredOption("--threshold <n>", "Multisig threshold", Number)
  .requiredOption("--members <addresses>", "Comma-separated founding member addresses")
  .action(poolCreate);

program
  .command("pool join")
  .description("Join an existing pool as a new member")
  .requiredOption("--pool <address>", "Pool Safe address")
  .requiredOption("--voucher <address>", "Address of member who vouches for you")
  .action(poolJoin);

program
  .command("pool status")
  .description("Show pool status, members, and balance")
  .requiredOption("--pool <address>", "Pool Safe address")
  .action(poolStatus);

program
  .command("pool sync")
  .description("Sync all member stream statuses onchain")
  .requiredOption("--pool <address>", "Pool Safe address")
  .action(poolSync);

program
  .command("pool stream-open")
  .description("Open a Superfluid stream to the pool")
  .requiredOption("--pool <address>", "Pool Safe address")
  .requiredOption("--flow-rate <rate>", "Monthly contribution in USD", Number)
  .action(poolStreamOpen);

program
  .command("claim submit")
  .description("Submit a new claim to the pool")
  .requiredOption("--pool <address>", "Pool Safe address")
  .requiredOption("--amount <usd>", "Amount in USD", Number)
  .requiredOption("--evidence <ipfs-hash>", "IPFS hash of evidence")
  .requiredOption("--description <text>", "Claim description")
  .action(claimSubmit);

program
  .command("claim list")
  .description("List all claims on a pool")
  .requiredOption("--pool <address>", "Pool Safe address")
  .option("--status <status>", "Filter by status (open|submitted|funded|completed|rejected|expired)")
  .action(claimList);

program
  .command("claim approve")
  .description("Approve a claim (multisig)")
  .requiredOption("--pool <address>", "Pool Safe address")
  .requiredOption("--claim-id <id>", "Claim ID", Number)
  .action(claimApprove);

program
  .command("claim reject")
  .description("Reject a claim (multisig)")
  .requiredOption("--pool <address>", "Pool Safe address")
  .requiredOption("--claim-id <id>", "Claim ID", Number)
  .action(claimReject);

program
  .command("serve")
  .description("Start health/status HTTP server")
  .option("--port <port>", "Port", Number, 3000)
  .action(serve);

program.parse();
