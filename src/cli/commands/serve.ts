import { createServer } from "http";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = parseInt(process.argv[process.argv.length - 1], 10) || 3000;

const server = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "mutual-aid-pool" }));
    return;
  }
  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log(`Mutual Aid Pool server running on http://0.0.0.0:${PORT}`);
});

process.on("SIGINT", () => {
  server.close();
  process.exit(0);
});
