import fs from "node:fs/promises";
import { z } from "zod";
import { resolveWorkspacePath } from "../workspace.js";

export function registerWorkspaceTools(server) {
    server.registerTool(
        "list_files",
        {
            description:
                "List files and folders in the VS Code workspace",

            inputSchema: {
                path: z
                    .string()
                    .default("")
                    .describe(
                        "Workspace-relative directory path"
                    ),
            },
        },

        async ({ path: directoryPath }) => {
            try {
                const folderPath =
                    resolveWorkspacePath(
                        directoryPath
                    );

                const entries =
                    await fs.readdir(
                        folderPath,
                        {
                            withFileTypes: true,
                        }
                    );

                const files =
                    entries.map(
                        (entry) => ({
                            name: entry.name,
                            type: entry.isDirectory()
                                ? "directory"
                                : "file",
                        })
                    );

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(
                                files,
                                null,
                                2
                            ),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text:
                                `Failed to list files: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );
}