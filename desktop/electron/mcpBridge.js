import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocket, WebSocketServer } from "ws";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MCP_SERVER_PATH = path.resolve(__dirname, "../../mcp-server/src/server.js");

let mcpProcess = null;
let currentWorkspace = null;
let websocketServer = null;
let heartbeatTimer = null;

let stdoutBuffer = "";

function sendSocketError(socket, message, id = null) {
    if (socket.readyState !== WebSocket.OPEN) {
        return;
    }

    try {
        socket.send(JSON.stringify({
            jsonrpc: "2.0",
            error: { code: -32000, message },
            id,
        }));
    } catch { }
}

function startMCP(workspacePath) {
    if (typeof workspacePath !== "string" || !workspacePath.trim()) {
        throw new Error("A valid workspace path is required.");
    }

    const normalizedWorkspace = path.resolve(workspacePath.trim());

    if (mcpProcess) {
        try {
            mcpProcess.kill();
        } catch { }
    }

    stdoutBuffer = "";

    const env = {
        ...process.env,

        // Electron's executable only behaves as Node when this flag is set.
        // This avoids relying on a globally installed `node` after packaging.
        ELECTRON_RUN_AS_NODE: "1",

        ALPHA_WORKSPACE_PATH:
            normalizedWorkspace
    };

    mcpProcess = spawn(
        process.execPath,
        [MCP_SERVER_PATH],
        {
            cwd:
                path.dirname(
                    MCP_SERVER_PATH
                ),

            env,

            stdio: [
                "pipe",
                "pipe",
                "pipe"
            ],

            windowsHide: true
        }
    );

    const childProcess = mcpProcess;

    currentWorkspace =
        normalizedWorkspace;

    childProcess.stdout.on(
        "data",
        (data) => {
            stdoutBuffer +=
                data.toString();

            const lines =
                stdoutBuffer.split("\n");

            stdoutBuffer =
                lines.pop() || "";

            for (const line of lines) {
                const message =
                    line.trim();

                if (!message) {
                    continue;
                }

                broadcastMCPMessage(
                    message
                );
            }
        }
    );

    childProcess.stderr.on(
        "data",
        (data) => {
            console.error(
                "[MCP STDERR]",
                data.toString()
            );
        }
    );

    childProcess.on(
        "error",
        (error) => {
            console.error(
                "[MCP PROCESS ERROR]",
                error
            );
        }
    );

    childProcess.on(
        "exit",
        (
            code,
            signal
        ) => {
            console.log(
                `MCP server exited. code=${code} signal=${signal}`
            );

            // A previous process may exit after a replacement was spawned.
            // Never clear the replacement's state in that race.
            if (mcpProcess === childProcess) {
                mcpProcess = null;
                currentWorkspace = null;
                stdoutBuffer = "";

                for (const socket of connectedSockets) {
                    sendSocketError(
                        socket,
                        `Local MCP server exited (code=${code}, signal=${signal || "none"}). Check Electron logs for stderr.`
                    );
                }
            }
        }
    );

    console.log(
        "Local MCP started for:",
        normalizedWorkspace
    );

    return {
        success: true,

        workspacePath:
            normalizedWorkspace
    };
}

const connectedSockets =
    new Set();

function broadcastMCPMessage(
    message
) {
    for (
        const socket
        of connectedSockets
    ) {
        if (
            socket.readyState ===
            WebSocket.OPEN
        ) {
            try {
                socket.send(
                    message
                );
            } catch (error) {
                console.error(
                    "Failed to send MCP response:",
                    error
                );
            }
        }
    }
}

export function startMCPBridge(
    port = 8765
) {
    if (websocketServer) {
        return websocketServer;
    }

    websocketServer =
        new WebSocketServer({
            host: "0.0.0.0",
            port
        });

    websocketServer.on(
        "connection",
        (socket) => {
            console.log(
                "MCP bridge client connected."
            );

            connectedSockets.add(
                socket
            );

            socket.isAlive = true;

            socket.on(
                "pong",
                () => {
                    socket.isAlive = true;
                }
            );

            socket.on(
                "message",
                (message) => {
                    let request;

                    try {
                        request =
                            JSON.parse(
                                message.toString()
                            );

                        if (
                            request.type ===
                            "workspace:start"
                        ) {
                            const result =
                                startMCP(
                                    request.workspacePath
                                );

                            socket.send(
                                JSON.stringify({
                                    type:
                                        "workspace:started",

                                    ...result
                                })
                            );

                            return;
                        }

                        if (
                            request.type ===
                            "mcp:stdin"
                        ) {
                            if (
                                !mcpProcess ||
                                !mcpProcess.stdin
                            ) {
                                throw new Error(
                                    "Local MCP server is not running."
                                );
                            }

                            const data =
                                request.data;

                            if (
                                typeof data !==
                                "string"
                            ) {
                                throw new Error(
                                    "MCP stdin data must be a string."
                                );
                            }

                            mcpProcess.stdin.write(
                                data.endsWith("\n")
                                    ? data
                                    : `${data}\n`
                            );

                            return;
                        }

                        // Let normal MCP JSON-RPC clients speak directly to
                        // the stdio server. The former bridge-only envelope
                        // rejected `initialize` and made clients report a
                        // generic "Connection closed" error.
                        if (request.jsonrpc === "2.0") {
                            if (!mcpProcess || !mcpProcess.stdin || mcpProcess.stdin.destroyed) {
                                throw new Error("Local MCP server is not running. Select a workspace first.");
                            }

                            mcpProcess.stdin.write(`${JSON.stringify(request)}\n`);
                            return;
                        }

                        throw new Error(
                            `Unknown bridge request: ${request.type}`
                        );
                    } catch (error) {
                        const errorMessage = error instanceof Error
                            ? error.message
                            : String(error);

                        if (typeof request?.id !== "undefined") {
                            sendSocketError(socket, errorMessage, request.id);
                        } else {
                            try {
                                socket.send(JSON.stringify({ type: "error", error: errorMessage }));
                            } catch { }
                        }
                    }
                }
            );

            socket.on(
                "close",
                () => {
                    connectedSockets.delete(
                        socket
                    );

                    console.log(
                        "MCP bridge client disconnected."
                    );
                }
            );

            socket.on(
                "error",
                (error) => {
                    connectedSockets.delete(
                        socket
                    );

                    console.error(
                        "MCP bridge socket error:",
                        error
                    );
                }
            );
        }
    );

    websocketServer.on(
        "error",
        (error) => {
            console.error(
                "MCP bridge server error:",
                error
            );
        }
    );

    console.log(
        `MCP bridge listening on ws://0.0.0.0:${port}`
    );

    heartbeatTimer = setInterval(
        () => {
            for (const socket of connectedSockets) {
                if (socket.readyState !== WebSocket.OPEN) {
                    continue;
                }

                if (socket.isAlive === false) {
                    socket.terminate();
                    continue;
                }

                socket.isAlive = false;
                socket.ping();
            }
        },
        25000
    );

    return websocketServer;
}

export function startWorkspaceMCP(
    workspacePath
) {
    return startMCP(
        workspacePath
    );
}

export function stopMCPBridge() {
    if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
    }

    if (mcpProcess) {
        try {
            mcpProcess.kill();
        } catch { }

        mcpProcess = null;
    }

    for (
        const socket
        of connectedSockets
    ) {
        try {
            socket.close();
        } catch { }
    }

    connectedSockets.clear();

    if (websocketServer) {
        try {
            websocketServer.close();
        } catch { }

        websocketServer = null;
    }

    currentWorkspace = null;
    stdoutBuffer = "";

    console.log(
        "MCP bridge stopped."
    );
}

export function getCurrentWorkspace() {
    return currentWorkspace;
}
