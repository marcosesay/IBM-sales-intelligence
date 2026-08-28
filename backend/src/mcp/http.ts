// http.ts — the Streamable HTTP transport for the same tools stdio.ts serves.
// Mounted at /mcp by app.ts, ahead of the SPA/404 catch-all.

import { createHash, timingSafeEqual } from "node:crypto";
import { Router, type IRouter, type NextFunction, type Request, type Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerTools } from "./tools";

const router: IRouter = Router();

const MCP_AUTH_TOKEN = process.env["MCP_AUTH_TOKEN"] ?? "";

// Compare digests rather than the raw strings: equal length keeps
// timingSafeEqual from throwing, and it leaks nothing about token length.
function tokenMatches(presented: string): boolean {
  const a = createHash("sha256").update(presented).digest();
  const b = createHash("sha256").update(MCP_AUTH_TOKEN).digest();
  return timingSafeEqual(a, b);
}

// Bearer auth on /mcp only — this is router-level middleware, so it cannot
// reach the /api routes mounted separately in app.ts. Preflight never lands
// here: the global cors() answers OPTIONS and ends the request first.
//
// An unset MCP_AUTH_TOKEN rejects everything rather than waving requests
// through, so a deploy that forgets the var fails closed. It stays a 401 (not
// a 503) so the response says nothing about how the server is configured.
function requireBearerToken(req: Request, res: Response, next: NextFunction): void {
  if (!MCP_AUTH_TOKEN) {
    req.log.error("MCP_AUTH_TOKEN is not set — rejecting every /mcp request");
    unauthorized(res);
    return;
  }

  const header = req.get("authorization") ?? "";
  const [scheme, ...rest] = header.split(" ");
  const presented = rest.join(" ").trim();

  if (scheme?.toLowerCase() !== "bearer" || !presented || !tokenMatches(presented)) {
    req.log.warn({ hasHeader: Boolean(header) }, "Rejected unauthorized /mcp request");
    unauthorized(res);
    return;
  }

  next();
}

function unauthorized(res: Response): void {
  res.status(401).set("WWW-Authenticate", "Bearer").json({
    jsonrpc: "2.0",
    error: { code: -32001, message: "Unauthorized" },
    id: null,
  });
}

router.use(requireBearerToken);

// Stateless: a fresh server + transport per request, closed with the response.
// No session id is issued, so the bare cors() in app.ts needs no
// exposedHeaders entry, and concurrent callers cannot collide on request ids.
router.post("/", async (req: Request, res: Response) => {
  const server = new McpServer({ name: "ibm-sales-intelligence", version: "0.1.0" });
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

  res.on("close", () => {
    void transport.close();
    void server.close();
  });

  try {
    registerTools(server);
    await server.connect(transport);
    // express.json() has already drained the stream, so hand over the parsed
    // body — without it the transport waits on a request that can't yield more.
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    req.log.error({ err }, "MCP request failed");
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
});

// GET (server→client stream) and DELETE (session teardown) only mean something
// in stateful mode. Answer them here rather than letting them fall through to
// the catch-all, which would hand a JSON-RPC client the SPA's index.html.
function statelessOnly(_req: Request, res: Response): void {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed: this endpoint is stateless, use POST" },
    id: null,
  });
}

router.get("/", statelessOnly);
router.delete("/", statelessOnly);

export default router;
