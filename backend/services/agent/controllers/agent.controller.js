import axios from "axios";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { graph } from "../graph/graph.js";
import { addMessage } from "../config/memory.js";

const execFileAsync = promisify(execFile);

async function persistChatMessage(payload) {
    try {
        await axios.post(`${process.env.CHAT_SERVICE}/save-message`, payload);
    } catch (error) {
        // A chat-service outage must not discard a completed agent response.
        console.error("Chat message persistence failed:", error.response?.data?.message || error.message);
    }
}

export const selectWorkspace = async (req, res, next) => {
    if (process.platform !== "win32") {
        return res.status(501).json({ message: "Native workspace selection is available when the agent service runs on Windows." });
    }

    try {
        const { stdout } = await execFileAsync("powershell.exe", [
            "-NoProfile",
            "-Command",
            "Add-Type -AssemblyName System.Windows.Forms; $dialog = New-Object System.Windows.Forms.FolderBrowserDialog; $dialog.Description = 'Select your VS Code workspace folder'; if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { [Console]::Out.Write($dialog.SelectedPath) }",
        ], { windowsHide: false });

        const workspacePath = stdout.trim();
        if (!workspacePath) return res.status(204).end();

        // Automatically launch VS Code on Windows
        try {
            const { spawn } = await import("node:child_process");
            const vscodeProcess = spawn("code", ["--new-window", workspacePath], {
                detached: true,
                stdio: "ignore",
                windowsHide: false,
                shell: true
            });
            vscodeProcess.unref();
        } catch (err) {
            console.error("Could not launch VS Code from workspace-picker:", err);
        }

        return res.status(200).json({ workspacePath });
    } catch (error) {
        next(error);
    }
};

export const agent = async (req, res, next) => {
    try {
        const { prompt, conversationId, agent, workspacePath } = req.body;
        const userId = req.headers["x-user-id"];
        const plan = req.headers["x-user-plan"] || "free";

        if (conversationId) {
            await persistChatMessage({
                conversationId,
                role: "user",
                content: prompt,
            });
        }

        const result = await graph.invoke({
            prompt,
            conversationId,
            agent,
            userId,
            plan,
            workspacePath: workspacePath?.trim() || undefined,
            file: req.file ? {
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                buffer: req.file.buffer
            } : undefined
        });

        const response = result.aiResponse;

        await addMessage(conversationId, "user", prompt);
        await addMessage(conversationId, "assistant", response);

        if (conversationId && response) {
            await persistChatMessage({
                conversationId,
                role: "assistant",
                content: typeof response === 'string' ? response : JSON.stringify(response),
                images: result.images,
                artifacts: result?.artifacts
            });
        }

        return res.status(200).json({
            answer: result?.aiResponse,
            images: result?.images,
            artifacts: result?.artifacts,
            agent: result?.agent
        });

    } catch (error) {
        next(error)
    }
}
