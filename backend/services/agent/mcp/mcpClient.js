import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const mcpServerPath = path.resolve(moduleDirectory, "../../../../mcp-server/src/server.js");
const clients = new Map();

async function getWorkspaceRoot(workspacePath) {
    if (!workspacePath || typeof workspacePath !== "string") {
        throw new Error("A VS Code workspace path is required to use coding tools.");
    }

    const workspaceRoot = path.resolve(workspacePath.trim());
    const stats = await fs.stat(workspaceRoot);
    if (!stats.isDirectory()) {
        throw new Error("The VS Code workspace path must point to a folder.");
    }
    return workspaceRoot;
}

export async function connectMCP(workspacePath) {
    const workspaceRoot = await getWorkspaceRoot(workspacePath);
    if (clients.has(workspaceRoot)) return clients.get(workspaceRoot).client;

    const client = new Client({
        name: "alpha-ai-agent",
        version: "1.0.0",
    });

    const transport = new StdioClientTransport({
        command: "node",
        args: [mcpServerPath],
        cwd: path.dirname(mcpServerPath),
        env: { ...process.env, WORKSPACE_ROOT: workspaceRoot },
        stderr: "pipe",
    });

    await client.connect(transport);
    clients.set(workspaceRoot, { client, transport });
    console.log(`MCP Client connected to workspace: ${workspaceRoot}`);
    return client;
}


export async function getMCPTools(workspacePath) {
    const mcpClient = await connectMCP(workspacePath);
    const response = await mcpClient.listTools();
    return response.tools;
}


export async function callMCPTool(workspacePath, toolName, toolArguments = {}) {
    const mcpClient = await connectMCP(workspacePath);

    if (typeof toolName !== "string" || toolName.trim() === "") {
        throw new TypeError("toolName must be a non-empty string");
    }

    return mcpClient.callTool({
        name: toolName,
        arguments: toolArguments,
    });
}
