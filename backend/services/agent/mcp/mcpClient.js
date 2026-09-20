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

class WebSocketClientTransport {
    constructor(url) {
        this.url = url;
        this.socket = null;
        this.onclose = undefined;
        this.onerror = undefined;
        this.onmessage = undefined;
    }

    get isOpen() {
        return this.socket?.readyState === WebSocket.OPEN;
    }

    start() {
        if (this.socket) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            let opened = false;
            const socket = new WebSocket(this.url);
            this.socket = socket;

            socket.addEventListener("open", () => {
                opened = true;
                resolve();
            });
            socket.addEventListener("message", (event) => {
                try {
                    this.onmessage?.(JSON.parse(String(event.data)));
                } catch (error) {
                    this.onerror?.(error instanceof Error ? error : new Error(String(error)));
                }
            });
            socket.addEventListener("error", () => {
                const error = new Error(`Unable to connect to the desktop MCP bridge at ${this.url}`);
                this.onerror?.(error);
                if (!opened) {
                    reject(error);
                }
            });
            socket.addEventListener("close", () => {
                this.socket = null;
                this.onclose?.();

                if (!opened) {
                    reject(new Error(`Desktop MCP bridge closed before initialization at ${this.url}`));
                }
            });
        });
    }

    async send(message) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            throw new Error("Desktop MCP bridge connection is not open.");
        }

        this.socket.send(JSON.stringify(message));
    }

    async close() {
        if (!this.socket) {
            return;
        }

        this.socket.close();
    }
}

export async function connectMCP(
    workspacePath = null
) {
    const targetWorkspace =
        typeof workspacePath === "string" &&
        workspacePath.trim()
            ? path.resolve(workspacePath.trim())
            : null;

    if (client && transport) {
        const canReuseTransport =
            !(transport instanceof WebSocketClientTransport) ||
            transport.isOpen;

        if (
            canReuseTransport &&
            (!targetWorkspace || currentWorkspace === targetWorkspace)
        ) {
            return client;
        }

        try {
            await transport.close();
        } catch {}

        client = null;
        transport = null;
        currentWorkspace = null;
    }

    const nextClient = new Client({
        name: "alpha-ai-agent",
        version: "1.0.0",
    });

    const env = {
        ...process.env,
    };

    if (targetWorkspace) {
        env.ALPHA_WORKSPACE_PATH =
            targetWorkspace;
    }

    // The agent can run inside Docker, but the selected workspace and VS Code
    // terminal are on Windows. In that deployment it must use Electron's local
    // MCP bridge instead of spawning a Linux MCP process in the container.
    const bridgeUrl = process.env.MCP_BRIDGE_URL?.trim();

    const nextTransport = bridgeUrl
        ? new WebSocketClientTransport(bridgeUrl)
        : new StdioClientTransport({
            command: process.execPath,
            args: [mcpServerPath],
            cwd: path.dirname(mcpServerPath),
            env,
            stderr: "pipe",
        });

    nextTransport.onclose = () => {
        if (transport === nextTransport) {
            client = null;
            transport = null;
            currentWorkspace = null;
        }
    };

    try {
        await nextClient.connect(
            nextTransport
        );
    } catch (error) {
        await nextTransport
            .close()
            .catch(() => {});

        throw error;
    }

    client = nextClient;
    transport = nextTransport;
    currentWorkspace = targetWorkspace;

    console.log(
        "MCP Client connected for workspace:",
        targetWorkspace || "default"
    );

    return client;
}

export async function getMCPTools(
    workspacePath = null
) {
    const mcpClient =
        await connectMCP(workspacePath);

    const response =
        await mcpClient.listTools();

    return response.tools;
}

export async function callMCPTool(
    toolName,
    toolArguments = {},
    workspacePath = null
) {
    const mcpClient =
        await connectMCP(workspacePath);

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
