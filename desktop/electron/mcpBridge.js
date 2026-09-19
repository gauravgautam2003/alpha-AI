import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MCP_SERVER_PATH = path.resolve(__dirname, "../../mcp-server/src/server.js");

let mcpProcess = null;
let currentWorkspace = null;
let websocketServer = null;

function startMCP(workspacePath) {
    if (typeof workspacePath !== "string" || !workspacePath.trim()) {
        throw new Error("A valid workspace path is required.");
    }

    const normalizedWorkspace =path.resolve(workspacePath.trim());

    if (mcpProcess) {
        try {
            mcpProcess.kill();
        } catch {}

        mcpProcess = null;
    }

    const env = {
        ...process.env,

        ALPHA_WORKSPACE_PATH:
            normalizedWorkspace
    };

    mcpProcess = spawn(process.execPath, [MCP_SERVER_PATH],{
            cwd:path.dirname( MCP_SERVER_PATH),
            env,
            stdio: ["pipe", "pipe", "pipe"],
            windowsHide: true
        }
    );

    currentWorkspace = normalizedWorkspace;

    mcpProcess.stdout.on("data", (data) => {
            const output = data.toString();
            console.log("[MCP STDOUT]",output);
        }
    );

    mcpProcess.stderr.on("data",(data) => {
            const error = data.toString();
            console.error("[MCP STDERR]",error);
        }
    );

    mcpProcess.on("error",(error) => {
            console.error("MCP process error:",error);
        }
    );

    mcpProcess.on("exit", (code, signal) => {
            console.log(`MCP server exited. code=${code} signal=${signal}`);

            mcpProcess = null;
            currentWorkspace = null;
        }
    );

    console.log("Local MCP started for:",normalizedWorkspace);

    return {
        success: true,
        workspacePath:normalizedWorkspace
    };
}

export function startMCPBridge(port = 8765) {
    if (websocketServer) {
        return websocketServer;
    }

    websocketServer = new WebSocketServer({
            host: "127.0.0.1",
            port
        });

    websocketServer.on("connection",(socket) => {
            console.log("MCP bridge client connected.");

            socket.on("message", (message) => {
                    try {
                        const request = JSON.parse(message.toString());

                        if (request.type === "workspace:start") {
                            const result = startMCP(request.workspacePath);

                            socket.send(JSON.stringify({
                                    type:"workspace:started",
                                    ...result
                                })
                            );

                            return;
                        }

                        if (request.type === "mcp:stdin") {
                            if (!mcpProcess || !mcpProcess.stdin) {
                                throw new Error("Local MCP server is not running.");
                            }

                            mcpProcess.stdin.write(request.data);
                            return;
                        }

                        throw new Error(`Unknown bridge request: ${request.type}`);
                    } catch (error) {
                        socket.send(JSON.stringify({
                                type: "error",
                                error: error instanceof Error ? error.message : String(error)
                            })
                        );
                    }
                }
            );

            socket.on("close",() => {
                    console.log("MCP bridge client disconnected.");
                });

            socket.on("error", (error) => {
                    console.error("MCP bridge socket error:",error);
                }
            );
        }
    );

    websocketServer.on("error", (error) => {
            console.error("MCP bridge server error:", error);
        });

    console.log(`MCP bridge listening on ws://127.0.0.1:${port}`);
    return websocketServer;
}

export function startWorkspaceMCP(workspacePath) {
    return startMCP(workspacePath);
}

export function stopMCPBridge() {
    if (mcpProcess) {
        try {
            mcpProcess.kill();
        } catch {}

        mcpProcess = null;
    }

    if (websocketServer) {
        try {
            websocketServer.close();
        } catch {}

        websocketServer = null;
    }

    currentWorkspace = null;
    console.log("MCP bridge stopped.");
}

export function getCurrentWorkspace() {
    return currentWorkspace;
}