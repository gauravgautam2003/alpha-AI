
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

function resolveCommandInvocation(command, args) {
    // npm/npx are .cmd shims on Windows. execFile cannot run a .cmd file
    // directly, so invoke it through cmd.exe with already-validated arguments.
    if (process.platform === "win32" && (command === "npm" || command === "npx")) {
        return {
            executable: process.env.ComSpec || "cmd.exe",
            args: ["/d", "/s", "/c", `${command} ${args.join(" ")}`],
        };
    }

    return { executable: command, args };
}


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

                if (
                    process.platform === "win32" &&
                    (command === "npm" || command === "npx") &&
                    args.some((arg) => /[&|<>()^%!]/.test(arg))
                ) {
                    throw new Error("Windows shell control characters are not allowed in npm/npx arguments");
                }


                // ------------------------------------------
                // Resolve workspace
                // ------------------------------------------

                const workingDirectory =
                    resolveWorkspacePath(cwd);


                // ------------------------------------------
                // Execute command
                // ------------------------------------------

                const invocation = resolveCommandInvocation(command, args);

                const { stdout, stderr } =
                    await execFileAsync(
                        invocation.executable,
                        invocation.args,
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
