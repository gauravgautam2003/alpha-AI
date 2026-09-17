import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

let client = null;
let transport = null;

export async function connectMCP() {
    if (client) {
        return client;
    }

    client = new Client({
        name: "alpha-ai-agent",
        version: "1.0.0",
    });

    transport = new StdioClientTransport({
        command: "node",
        args: [
            "mcp-server/src/server.js",
        ],
    });

    await client.connect(transport);
    console.log("MCP Client connected");
    return client;
}


export async function getMCPTools() {
    const mcpClient = await connectMCP();
    const response = await mcpClient.listTools();
    return response.tools;
}


export async function callMCPTool(toolName, toolArguments = {}) {
    const mcpClient = await connectMCP();

    if (typeof toolName !== "string" || toolName.trim() === "") {
        throw new TypeError("toolName must be a non-empty string");
    }

    return mcpClient.callTool({
        name: toolName,
        arguments: toolArguments,
    });
}
