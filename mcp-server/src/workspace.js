import "dotenv/config";
import path from "node:path";

export const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT

if (!WORKSPACE_ROOT) {
    throw new Error("WORKSPACE_ROOT is required");
}

export function resolveWorkspacePath(filePath) {
    const absolutePath = path.resolve(WORKSPACE_ROOT, filePath);

    if (absolutePath !== WORKSPACE_ROOT && !absolutePath.startsWith(WORKSPACE_ROOT + path.sep)) {
        throw new Error("Access denied: path is outside workspace");
    }

    return absolutePath;
}