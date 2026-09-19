import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { registerFileTools } from "./tools/fileTools.js";
import { registerWorkspaceTools } from "./tools/workspaceTools.js";
import { registerTerminalTools } from "./tools/terminalTools.js";
import { registerGitTools } from "./tools/gitTools.js";

import { setWorkspaceRoot } from "./workspace.js";

const workspacePath = process.env.ALPHA_WORKSPACE_PATH;

if (!workspacePath) {
    throw new Error(
        "ALPHA_WORKSPACE_PATH is required."
    );
}

setWorkspaceRoot(workspacePath);

const server = new McpServer({
    name: "alpha-ai-mcp-server",
    version: "1.0.0",
});

registerFileTools(server);
registerWorkspaceTools(server);
registerTerminalTools(server);
registerGitTools(server);

const transport = new StdioServerTransport();

await server.connect(transport);