import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./tools";

const server = new McpServer({ name: "ibm-sales-intelligence", version: "0.1.0" });

registerTools(server);

await server.connect(new StdioServerTransport());
