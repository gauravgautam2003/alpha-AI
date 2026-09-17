import fs from "node:fs/promises";
import { z } from "zod";
import { resolveWorkspacePath } from "../workspace.js";
import pathModule from "node:path";

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


    server.registerTool(
        "write_file",
        {
            description: "Create or update a file in the VS Code workspace",

            inputSchema: {
                path: z
                    .string()
                    .describe("Workspace-relative file path"),

                content: z
                    .string()
                    .describe("Content to write into the file"),
            },
        },

        async ({ path, content }) => {
            try {
                const filePath = resolveWorkspacePath(path);

                await fs.writeFile(
                    filePath,
                    content,
                    "utf-8"
                );

                return {
                    content: [
                        {
                            type: "text",
                            text: `File written successfully: ${path}`,
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to write file: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );

    server.registerTool(
        "create_directory",
        {
            description: "Create a directrory in the vs code workspace",
            inputSchema: {
                path: z.string().describe("Workspace-relative directory path")
            },
        },

        async ({ path }) => {
            try {
                const directoryPath = resolveWorkspacePath(path);

                await fs.mkdir(directoryPath, {
                    recursive: true
                });

                return {
                    content: [
                        {
                            type: "text",
                            text: `Directory created successfully: ${path}`
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to create directory: ${error.message}`
                        },
                    ],
                    isError: true,
                }
            }
        }
    );

    server.registerTool(
        "delete_file",
        {
            description: "Delete a file from the vs code workspace",
            inputSchema: {
                path: z.string().describe("Workspace-relative file path")
            },
        },

        async ({ path }) => {
            try {
                const filePath = resolveWorkspacePath(path);

                await fs.unlink(filePath);

                return {
                    content: [
                        {
                            type: "text",
                            text: `File deleted successfully: ${path}`
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to delete file: ${error.message}`
                        },
                    ],
                    isError: true,
                }
            }
        }
    );

    server.registerTool(
        "delete_directory",
        {
            description: "Delete a directory from the vs code workspace",
            inputSchema: {
                path: z.string().describe("Workspace-relative directory path")
            },
        },

        async ({ path }) => {
            try {
                const directoryPath = resolveWorkspacePath(path);

                await fs.rm(directoryPath, {
                    recursive: true,
                    force: true,
                });

                return {
                    content: [
                        {
                            type: "text",
                            text: `Directory deleted successfully: ${path}`,
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to delete directory: ${error.message}`,
                        },
                    ],
                };
            };
        },
    );

    server.registerTool(
        "move_file",
        {
            description: "Move or rename a file in the VS Code workspace",
            inputSchema: {
                path: z.string().describe("Current workspace-relative file path")
            },
        },

        async ({ source, destination }) => {
            try {
                const sourcePath = resolveWorkspacePath(source);
                const destinationPath = resolveWorkspacePath(destination);

                await fs.rename(sourcePath, destinationPath);

                return {
                    content: [
                        {
                            type: "text",
                            text: `File moved successfully: ${source} -> ${destination}`
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to move file: ${error.message}`
                        },
                    ],
                    isError: true,
                };
            }
        }
    );

    server.registerTool(
        "copy_file",
        {
            description: "Copy a file in the VS Code workspace",
            inputSchema: {
                path: z.string().describe("Destination workspace-relative file path")
            },
        },

        async ({ source, destination }) => {
            try {
                const sourcePath = resolveWorkspacePath(source);
                const destinationPath = resolveWorkspacePath(destination);

                await fs.copyFile(
                    sourcePath,
                    destinationPath
                );


                return {
                    content: [
                        {
                            type: "text",
                            text: `File copy successfully: ${source} -> ${destination}`
                        },
                    ],
                };

            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to copy file: ${error.message}`
                        },
                    ],
                    isError: true,
                };
            };
        },
    );

    server.registerTool(
        "search_file",
        {
            description: "Search for text inside files in the VS Code workspace",
            inputSchema: {
                path: z.string().describe("Text to search for")
            },
        },

        async ({ query, path: directoryPath }) => {
            try {
                const rootPath = resolveWorkspacePath(directoryPath);
                const results = [];

                async function searchDirectory(currentPath) {
                    const entries = await fs.readdir(currentPath, {
                        withFileTypes: true
                    });

                    for (const entry of entries) {
                        if (entry.name == "node_modules" || entry.name == ".git") continue;
                    }

                    const fullPath = pathModule.join(currentPath, entry.name);

                    if (entry.isDirectory()) {
                        await searchDirectory(fullPath);
                    }
                    else {
                        try {
                            const content = await fs.readFile(fullPath, "utf-8");

                            if (content.includes(query)) {
                                results.push(path.relative(rootPath, fullPath));
                            }
                        } catch (error) {
                            // Ignore binary/unreadable files
                        }
                    }
                }
                await searchDirectory(rootPath);

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({ query, results }, null, 2)
                        },
                    ],
                };
            }
            catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to search files: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    )
}