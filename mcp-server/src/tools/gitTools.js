import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";
import { resolveWorkspacePath } from "../workspace.js";

const execFileAsync = promisify(execFile);


async function runGit(args, cwd) {
    const workingDirectory = resolveWorkspacePath(cwd);

    const { stdout, stderr } = await execFileAsync(
            "git",
            args,
            {
                cwd: workingDirectory,
                timeout: 30000,
                maxBuffer: 5 * 1024 * 1024,
                windowsHide: true,
            }
        );

    return {
        stdout,
        stderr,
    };
}


export function registerGitTools(server) {

    // ==========================================
    // GIT STATUS
    // ==========================================

    server.registerTool(
        "git_status",
        {
            description:
                "Get the current Git status of the workspace",

            inputSchema: {
                path: z
                    .string()
                    .default("")
                    .describe("Workspace-relative Git repository path"),
            },
        },

        async ({ path }) => {
            try {
                const result = await runGit(
                        ["status", "--short"],
                        path
                    );

                return {
                    content: [
                        {
                            type: "text",
                            text: result.stdout || "Working tree clean",
                        },
                    ],
                };

            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Git status failed: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );


    // ==========================================
    // GIT DIFF
    // ==========================================

    server.registerTool(
        "git_diff",
        {
            description:
                "Show changes in the Git working tree",

            inputSchema: {
                path: z
                    .string()
                    .default("")
                    .describe("Workspace-relative Git repository path"),
            },
        },

        async ({ path }) => {
            try {
                const result = await runGit(
                        ["diff"],
                        path
                    );

                return {
                    content: [
                        {
                            type: "text",
                            text: result.stdout || "No changes found",
                        },
                    ],
                };

            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Git diff failed: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );


    // ==========================================
    // GIT LOG
    // ==========================================

    server.registerTool(
        "git_log",
        {
            description:
                "Get recent Git commits",

            inputSchema: {
                path: z
                    .string()
                    .default("")
                    .describe("Workspace-relative Git repository path"),

                limit: z
                    .number()
                    .int()
                    .min(1)
                    .max(50)
                    .default(10)
                    .describe("Number of commits"),
            },
        },

        async ({ path, limit }) => {
            try {
                const result = await runGit([
                            "log",
                            `-${limit}`,
                            "--oneline",
                        ],
                        path
                    );

                return {
                    content: [
                        {
                            type: "text",
                            text: result.stdout || "No commits found",
                        },
                    ],
                };

            } catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Git log failed: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );
}