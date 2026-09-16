import "dotenv/config";
import path from "node:path";

const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT;

if (!WORKSPACE_ROOT) {
    throw new Error("WORKSPACE_ROOT is required");
}

export function resolveWorkspacePath(filePath) {
    const absoluteRoot = path.resolve(WORKSPACE_ROOT);
    const absolutePath = path.resolve(absoluteRoot, filePath);

    if (
        absolutePath !== absoluteRoot &&
        !absolutePath.startsWith(absoluteRoot + path.sep)
    ) {
        throw new Error("Access denied: path is outside workspace");
    }

    return absolutePath;
}

export { WORKSPACE_ROOT };

