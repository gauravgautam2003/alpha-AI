import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

import path from "node:path";
import { fileURLToPath } from "node:url";

const moduleDirectory = path.dirname(
    fileURLToPath(import.meta.url)
);

const mcpServerPath = path.resolve(
    moduleDirectory,
    "../../../../mcp-server/src/server.js"
);

let client = null;
let transport = null;
let currentWorkspace = null;

export async function connectMCP(workspacePath = null) {
    const targetWorkspace = workspacePath ? path.resolve(workspacePath.trim()) : null;

    if (client && transport) {
        if (!targetWorkspace || currentWorkspace === targetWorkspace) {
            return client;
        }
        // Workspace changed; close previous transport so new server runs with updated WORKSPACE_ROOT
        try {
            await transport.close();
        } catch { }
        client = null;
        transport = null;
    }

    const nextClient = new Client({
        name: "alpha-ai-agent",
        version: "1.0.0",
    });

    const env = {
        ...process.env,
    };

    if (targetWorkspace) {
        env.WORKSPACE_ROOT = targetWorkspace;
    }

    const nextTransport = new StdioClientTransport({
        command: process.execPath,
        args: [mcpServerPath],
        cwd: path.dirname(mcpServerPath),
        env,
        stderr: "pipe",
    });

    try {
        await nextClient.connect(nextTransport);
    } catch (error) {
        await nextTransport.close().catch(() => { });
        throw error;
    }

    client = nextClient;
    transport = nextTransport;
    currentWorkspace = targetWorkspace;

    console.log("MCP Client connected for workspace:", targetWorkspace || "default");

    return client;
}

export async function getMCPTools(workspacePath = null) {
    const mcpClient = await connectMCP(workspacePath);

    const response = await mcpClient.listTools();

    return response.tools;
}

export async function callMCPTool(
    toolName,
    toolArguments = {},
    workspacePath = null
) {
    const mcpClient = await connectMCP(workspacePath);

    if (
        typeof toolName !== "string" ||
        toolName.trim() === ""
    ) {
        throw new TypeError(
            "toolName must be a non-empty string"
        );
    }

    return mcpClient.callTool({
        name: toolName,
        arguments: toolArguments,
    });
}