import { createServer } from "http";

export async function serve(opts: { port: number }): Promise<void> {
  const addr = `0.0.0.0:${opts.port}`;
  const server = createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", service: "mutual-aid-pool" }));
      return;
    }
    res.writeHead(404);
    res.end();
  });

  server.listen(addr, () => {
    console.log(`Mutual Aid Pool server running on http://${addr}`);
  });

  process.on("SIGINT", () => {
    server.close();
    process.exit(0);
  });
}
