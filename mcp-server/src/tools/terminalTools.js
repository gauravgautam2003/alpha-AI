
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import pathModule from "node:path";
import { z } from "zod";
import { resolveWorkspacePath } from "../workspace.js";

const execFileAsync = promisify(execFile);


// Commands allowed for the AI agent
const ALLOWED_COMMANDS = new Set([
    "node",
    "pip",
    "npm",
    "npx",
    "git",
]);


// Commands that should never be executed
const BLOCKED_ARGUMENTS = [
    "rm -rf",
    "rmdir /s",
    "del /f",
    "format",
    "shutdown",
    "restart-computer",
];


export function registerTerminalTools(server) {

    server.registerTool(
        "run_command",
        {
            description: "Run an approved terminal command inside the VS Code workspace",

            inputSchema: {
                command: z
                    .string()
                    .describe("Command executable, for example npm or git"),

                args: z
                    .array(z.string())
                    .default([])
                    .describe("Command arguments"),

                cwd: z
                    .string()
                    .default("")
                    .describe("Workspace-relative working directory"),
            },
        },

        async ({ command, args, cwd }) => {

            try {

                // ------------------------------------------
                // Validate command
                // ------------------------------------------

                if (!ALLOWED_COMMANDS.has(command)) {
                    throw new Error(
                        `Command not allowed: ${command}`
                    );
                }


                // ------------------------------------------
                // Validate arguments
                // ------------------------------------------

                const fullCommand =
                    `${command} ${args.join(" ")}`;

                const lowerCommand =
                    fullCommand.toLowerCase();

                for (const blocked of BLOCKED_ARGUMENTS) {

                    if (lowerCommand.includes(blocked.toLowerCase())) {
                        throw new Error(
                            `Blocked command pattern: ${blocked}`
                        );
                    }
                }


                // ------------------------------------------
                // Resolve workspace
                // ------------------------------------------

                const workingDirectory =
                    resolveWorkspacePath(cwd);


                // ------------------------------------------
                // Execute command
                // ------------------------------------------

                const { stdout, stderr } =
                    await execFileAsync(
                        command,
                        args,
                        {
                            cwd: workingDirectory,
                            timeout: 30000,
                            maxBuffer: 1024 * 1024 * 5,
                            windowsHide: true,
                        }
                    );


                // ------------------------------------------
                // Return result
                // ------------------------------------------

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(
                                {
                                    command,
                                    args,
                                    cwd:
                                        pathModule.relative(
                                            resolveWorkspacePath(""),
                                            workingDirectory
                                        ),
                                    stdout,
                                    stderr,
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
                            text: JSON.stringify(
                                {
                                    error: error.message,
                                    stdout:
                                        error.stdout || "",
                                    stderr:
                                        error.stderr || "",
                                },
                                null,
                                2
                            ),
                        },
                    ],

                    isError: true,
                };
            }
        }
    );
}