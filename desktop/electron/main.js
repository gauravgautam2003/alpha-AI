import {
    app,
    BrowserWindow,
    dialog,
    ipcMain
} from "electron";

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
            preload: path.join(
                __dirname,
                "preload.cjs"
            ),
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

    mainWindow.loadURL(
        "http://localhost:4000"
    );
}

ipcMain.handle(
    "workspace:select",
    async () => {
        if (!mainWindow) {
            throw new Error(
                "Electron window is not available."
            );
        }

        const result =
            await dialog.showOpenDialog(
                mainWindow,
                {
                    title:
                        "Select Alpha AI Workspace",

                    properties: [
                        "openDirectory"
                    ]
                }
            );

        if (
            result.canceled ||
            result.filePaths.length === 0
        ) {
            return {
                canceled: true,
                path: null
            };
        }

        const selectedPath =
            result.filePaths[0];

        try {
            const vscodeProcess =
                spawn(
                    VSCODE_PATH,
                    [
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
            console.error(
                "Failed to launch VS Code:",
                error
            );
        }

        return {
            canceled: false,
            path: selectedPath
        };
    }
);

ipcMain.handle(
    "vscode:open",
    async (
        _event,
        workspacePath
    ) => {
        if (
            typeof workspacePath !== "string" ||
            !workspacePath.trim()
        ) {
            throw new Error(
                "A valid workspace path is required."
            );
        }

        const normalizedPath =
            path.resolve(
                workspacePath.trim()
            );

        const vscodeProcess =
            spawn(
                VSCODE_PATH,
                [
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

        return {
            success: true,
            path: normalizedPath
        };
    }
);

app.whenReady().then(() => {
    createWindow();

    app.on(
        "activate",
        () => {
            if (
                BrowserWindow
                    .getAllWindows()
                    .length === 0
            ) {
                createWindow();
            }
        }
    );
});

app.on(
    "window-all-closed",
    () => {
        if (
            process.platform !== "darwin"
        ) {
            app.quit();
        }
    }
);