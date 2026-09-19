import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { startMCPBridge, stopMCPBridge, startWorkspaceMCP } from "./mcpBridge.js";

import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VSCODE_PATH = "C:\\Users\\This PC\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe";

let mainWindow = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1440,
        height: 900,
        minWidth: 1000,
        minHeight: 700,
        show: false,

        webPreferences: {
            preload: path.join(__dirname, "preload.cjs"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        }
    });

    mainWindow.once(
        "ready-to-show",
        () => {
            mainWindow.show();
        }
    );

    mainWindow.on(
        "closed",
        () => {
            mainWindow = null;
        }
    );

    mainWindow.loadURL("http://localhost:4000");
}

ipcMain.handle(
    "workspace:select",
    async () => {
        if (!mainWindow) {
            throw new Error("Electron window is not available.");
        }

        const result = await dialog.showOpenDialog(
                mainWindow,
                {
                    title: "Select Alpha AI Workspace",

                    properties: [
                        "openDirectory"
                    ]
                }
            );

        if (result.canceled || result.filePaths.length === 0) {
            return {
                canceled: true,
                path: null
            };
        }

        const selectedPath = result.filePaths[0];
        startWorkspaceMCP(selectedPath);

        try {
            const vscodeProcess = spawn(VSCODE_PATH,[
                        "--new-window",
                        selectedPath
                    ],
                    {
                        detached: true,
                        stdio: "ignore",
                        windowsHide: false
                    }
                );

            vscodeProcess.unref();
        } catch (error) {
            console.error("Failed to launch VS Code:",error);
        }

        return {
            canceled: false,
            path: selectedPath
        };
    }
);

ipcMain.handle("vscode:open",async (_,workspacePath) => {
        try {
            const normalizedPath = typeof workspacePath === "string"
                    ? workspacePath.trim()
                    : "";

            if (!normalizedPath) {
                throw new Error("Workspace path is required.");
            }

            const vscodeProcess = spawn(VSCODE_PATH,[
                        "--new-window",
                        normalizedPath
                    ],
                    {
                        detached: true,
                        stdio: "ignore",
                        windowsHide: false
                    }
                );

            vscodeProcess.unref();

            return {
                success: true,
                path: normalizedPath
            };
        } catch (error) {
            console.error("Failed to open VS Code:",error);

            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
);

app.whenReady().then(() => {
    createWindow();

    // Start local WebSocket MCP bridge
    startMCPBridge(8765);

    app.on("activate", () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                createWindow();
            }
        }
    );
});

app.on("before-quit",() => {
        // Stop local MCP bridge
        stopMCPBridge();
    }
);

app.on("window-all-closed", () => {
        if (process.platform !== "darwin") {
            app.quit();
        }
    }
);