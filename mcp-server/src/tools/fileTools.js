import fs from "node:fs/promises";
import { z } from "zod";
import { resolveWorkspacePath } from "../workspace.js";

export function registerFileTools(server) {
    server.registerTool(
        "read_file",
        {
            description: "Read a file from the VS Code workspace",
            
            inputSchema: {
                path: z.string().describe("Workspace-relative file path"),
            },
        },
        async ({ path }) => {
            try {
                const filePath = resolveWorkspacePath(path);
                const content = await fs.readFile(filePath, "utf-8");

                return {
                    content: [
                        {
                            type: "text",
                            text: content,
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to read file: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );
}