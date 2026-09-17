
import fs from "node:fs/promises";
import pathModule from "node:path";
import { z } from "zod";
import { resolveWorkspacePath } from "../workspace.js";


// Resolve destination.
// If destination is an existing directory,
// place the source file inside that directory.
async function resolveFileDestination(sourcePath, destinationPath) {
    try {
        const destinationStats = await fs.stat(destinationPath);

        return destinationStats.isDirectory()
            ? pathModule.join(
                destinationPath,
                pathModule.basename(sourcePath)
            )
            : destinationPath;

    } catch (error) {
        if (error.code === "ENOENT") {
            return destinationPath;
        }

        throw error;
    }
}


export function registerFileTools(server) {

    // ==========================================
    // READ FILE
    // ==========================================

    server.registerTool(
        "read_file",
        {
            description: "Read a file from the VS Code workspace",

            inputSchema: {
                path: z
                    .string()
                    .describe("Workspace-relative file path"),
            },
        },

        async ({ path }) => {
            try {
                const filePath = resolveWorkspacePath(path);

                const content = await fs.readFile(
                    filePath,
                    "utf-8"
                );

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


    // ==========================================
    // WRITE FILE
    // ==========================================

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


    // ==========================================
    // CREATE DIRECTORY
    // ==========================================

    server.registerTool(
        "create_directory",
        {
            description: "Create a directory in the VS Code workspace",

            inputSchema: {
                path: z
                    .string()
                    .describe("Workspace-relative directory path"),
            },
        },

        async ({ path }) => {
            try {
                const directoryPath = resolveWorkspacePath(path);

                await fs.mkdir(directoryPath, {
                    recursive: true,
                });

                return {
                    content: [
                        {
                            type: "text",
                            text: `Directory created successfully: ${path}`,
                        },
                    ],
                };

            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to create directory: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );


    // ==========================================
    // DELETE FILE
    // ==========================================

    server.registerTool(
        "delete_file",
        {
            description: "Delete a file from the VS Code workspace",

            inputSchema: {
                path: z
                    .string()
                    .describe("Workspace-relative file path"),
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
                            text: `File deleted successfully: ${path}`,
                        },
                    ],
                };

            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to delete file: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );


    // ==========================================
    // DELETE DIRECTORY
    // ==========================================

    server.registerTool(
        "delete_directory",
        {
            description: "Delete a directory from the VS Code workspace",

            inputSchema: {
                path: z
                    .string()
                    .describe("Workspace-relative directory path"),
            },
        },

        async ({ path }) => {
            try {
                const directoryPath = resolveWorkspacePath(path);

                if (directoryPath === resolveWorkspacePath("")) {
                    throw new Error("Refusing to delete the workspace root");
                }

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
                    isError: true,
                };
            }
        }
    );


    // ==========================================
    // MOVE FILE
    // ==========================================

    server.registerTool(
        "move_file",
        {
            description: "Move or rename a file in the VS Code workspace",

            inputSchema: {
                source: z
                    .string()
                    .describe("Current workspace-relative file path"),

                destination: z
                    .string()
                    .describe("Destination workspace-relative file or directory path"),
            },
        },

        async ({ source, destination }) => {
            try {
                const sourcePath = resolveWorkspacePath(source);

                const destinationPath =
                    await resolveFileDestination(
                        sourcePath,
                        resolveWorkspacePath(destination)
                    );

                await fs.rename(
                    sourcePath,
                    destinationPath
                );

                return {
                    content: [
                        {
                            type: "text",
                            text: `File moved successfully: ${source} -> ${destination}`,
                        },
                    ],
                };

            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to move file: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );


    // ==========================================
    // COPY FILE
    // ==========================================

    server.registerTool(
        "copy_file",
        {
            description: "Copy a file in the VS Code workspace",

            inputSchema: {
                source: z
                    .string()
                    .describe("Source workspace-relative file path"),

                destination: z
                    .string()
                    .describe("Destination workspace-relative file or directory path"),
            },
        },

        async ({ source, destination }) => {
            try {
                const sourcePath = resolveWorkspacePath(source);

                const destinationPath =
                    await resolveFileDestination(
                        sourcePath,
                        resolveWorkspacePath(destination)
                    );

                await fs.copyFile(
                    sourcePath,
                    destinationPath
                );

                return {
                    content: [
                        {
                            type: "text",
                            text: `File copied successfully: ${source} -> ${destination}`,
                        },
                    ],
                };

            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to copy file: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );


    // ==========================================
    // SEARCH FILES
    // ==========================================

    server.registerTool(
        "search_files",
        {
            description: "Search for text inside files in the VS Code workspace",

            inputSchema: {
                query: z
                    .string()
                    .describe("Text to search for"),

                path: z
                    .string()
                    .default("")
                    .describe("Workspace-relative directory or file path"),
            },
        },

        async ({ query, path: directoryPath }) => {
            try {
                const rootPath =
                    resolveWorkspacePath(directoryPath);

                const results = [];

                const rootStats =
                    await fs.stat(rootPath);


                // ------------------------------------------
                // SEARCH A SINGLE FILE
                // ------------------------------------------

                if (rootStats.isFile()) {

                    try {
                        const content =
                            await fs.readFile(
                                rootPath,
                                "utf-8"
                            );

                        if (content.includes(query)) {
                            results.push(
                                pathModule.relative(
                                    resolveWorkspacePath(""),
                                    rootPath
                                )
                            );
                        }

                    } catch {
                        // Ignore binary/unreadable files
                    }

                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify(
                                    {
                                        query,
                                        results,
                                    },
                                    null,
                                    2
                                ),
                            },
                        ],
                    };
                }


                // ------------------------------------------
                // SEARCH DIRECTORY RECURSIVELY
                // ------------------------------------------

                async function searchDirectory(currentPath) {

                    const entries =
                        await fs.readdir(
                            currentPath,
                            {
                                withFileTypes: true,
                            }
                        );


                    for (const entry of entries) {

                        // Skip large/unnecessary folders
                        if (
                            entry.name === "node_modules" ||
                            entry.name === ".git"
                        ) {
                            continue;
                        }


                        const fullPath =
                            pathModule.join(
                                currentPath,
                                entry.name
                            );


                        if (entry.isDirectory()) {

                            await searchDirectory(
                                fullPath
                            );

                        } else {

                            try {

                                const content =
                                    await fs.readFile(
                                        fullPath,
                                        "utf-8"
                                    );


                                if (
                                    content.includes(query)
                                ) {
                                    results.push(
                                        pathModule.relative(
                                            resolveWorkspacePath(""),
                                            fullPath
                                        )
                                    );
                                }

                            } catch {
                                // Ignore binary/unreadable files
                            }
                        }
                    }
                }


                await searchDirectory(rootPath);


                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(
                                {
                                    query,
                                    results,
                                },
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
                            text: `Failed to search files: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );

    // ==========================================
    // 1. GET FILE INFO
    // ==========================================

    server.registerTool(
        "get_file_info",
        {
            description: "Get metadata about a file or directory",

            inputSchema: {
                path: z
                    .string()
                    .describe("Workspace-relative file or directory path"),
            },
        },

        async ({ path }) => {
            try {
                const filePath = resolveWorkspacePath(path);

                const stats = await fs.stat(filePath);

                const info = {
                    path,
                    type: stats.isDirectory()
                        ? "directory"
                        : "file",
                    size: stats.size,
                    createdAt: stats.birthtime,
                    modifiedAt: stats.mtime,
                };

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(
                                info,
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
                            text: `Failed to get file info: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );


    // ==========================================
    // 2. REPLACE IN FILE
    // ==========================================

    server.registerTool(
        "replace_in_file",
        {
            description: "Replace exact text inside a file",

            inputSchema: {
                path: z
                    .string()
                    .describe("Workspace-relative file path"),

                search: z
                    .string()
                    .describe("Exact text to find"),

                replacement: z
                    .string()
                    .describe("Text to replace it with"),
            },
        },

        async ({ path, search, replacement }) => {
            try {
                const filePath = resolveWorkspacePath(path);

                const content = await fs.readFile(
                    filePath,
                    "utf-8"
                );

                if (!content.includes(search)) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Text not found in file: ${path}`,
                            },
                        ],
                        isError: true,
                    };
                }

                const updatedContent =
                    content.replace(
                        search,
                        replacement
                    );

                await fs.writeFile(
                    filePath,
                    updatedContent,
                    "utf-8"
                );

                return {
                    content: [
                        {
                            type: "text",
                            text: `Text replaced successfully in: ${path}`,
                        },
                    ],
                };

            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to replace text: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );


    // ==========================================
    // 3. READ DIRECTORY TREE
    // ==========================================

    server.registerTool(
        "read_directory_tree",
        {
            description: "Read the directory structure recursively",

            inputSchema: {
                path: z
                    .string()
                    .default("")
                    .describe("Workspace-relative directory path"),

                maxDepth: z
                    .number()
                    .int()
                    .min(0)
                    .default(3)
                    .describe("Maximum directory depth"),
            },
        },

        async ({ path, maxDepth }) => {
            try {
                const rootPath =
                    resolveWorkspacePath(path);

                async function buildTree(
                    currentPath,
                    depth
                ) {
                    if (depth > maxDepth) {
                        return [];
                    }

                    const entries =
                        await fs.readdir(
                            currentPath,
                            {
                                withFileTypes: true,
                            }
                        );

                    const tree = [];

                    for (const entry of entries) {

                        if (
                            entry.name === "node_modules" ||
                            entry.name === ".git"
                        ) {
                            continue;
                        }

                        const fullPath =
                            pathModule.join(
                                currentPath,
                                entry.name
                            );

                        const item = {
                            name: entry.name,
                            type: entry.isDirectory()
                                ? "directory"
                                : "file",
                        };

                        if (entry.isDirectory()) {
                            item.children =
                                await buildTree(
                                    fullPath,
                                    depth + 1
                                );
                        }

                        tree.push(item);
                    }

                    return tree;
                }

                const tree =
                    await buildTree(
                        rootPath,
                        0
                    );

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(
                                tree,
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
                            text: `Failed to read directory tree: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );


    // ==========================================
    // 4. CREATE FILE
    // ==========================================

    server.registerTool(
        "create_file",
        {
            description: "Create a new empty file",

            inputSchema: {
                path: z
                    .string()
                    .describe("Workspace-relative file path"),
            },
        },

        async ({ path }) => {
            try {
                const filePath =
                    resolveWorkspacePath(path);

                await fs.writeFile(
                    filePath,
                    "",
                    {
                        encoding: "utf-8",
                        flag: "wx",
                    }
                );

                return {
                    content: [
                        {
                            type: "text",
                            text: `File created successfully: ${path}`,
                        },
                    ],
                };

            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to create file: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );


    // ==========================================
    // 5. APPEND TO FILE
    // ==========================================

    server.registerTool(
        "append_to_file",
        {
            description: "Append text to an existing file",

            inputSchema: {
                path: z
                    .string()
                    .describe("Workspace-relative file path"),

                content: z
                    .string()
                    .describe("Text to append"),
            },
        },

        async ({ path, content }) => {
            try {
                const filePath =
                    resolveWorkspacePath(path);

                await fs.appendFile(
                    filePath,
                    content,
                    "utf-8"
                );

                return {
                    content: [
                        {
                            type: "text",
                            text: `Content appended successfully: ${path}`,
                        },
                    ],
                };

            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to append content: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );


    // ==========================================
    // 6. CLEAR FILE
    // ==========================================

    server.registerTool(
        "clear_file",
        {
            description: "Remove all content from a file",

            inputSchema: {
                path: z
                    .string()
                    .describe("Workspace-relative file path"),
            },
        },

        async ({ path }) => {
            try {
                const filePath =
                    resolveWorkspacePath(path);

                await fs.writeFile(
                    filePath,
                    "",
                    "utf-8"
                );

                return {
                    content: [
                        {
                            type: "text",
                            text: `File cleared successfully: ${path}`,
                        },
                    ],
                };

            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to clear file: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );
}

