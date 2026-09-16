import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerFileTools } from "./tools/fileTools.js";
import { registerWorkspaceTools } from "./tools/workspaceTools.js";

const server = new McpServer({
    name: "alpha-ai-mcp-server",
    version: "1.0.0",
});

registerFileTools(server);
registerWorkspaceTools(server);

const transport = new StdioServerTransport();

await server.connect(transport);