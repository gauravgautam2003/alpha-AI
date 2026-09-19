import path from "node:path";

let workspaceRoot = null;

export function setWorkspaceRoot(rootPath) {
    if (typeof rootPath !== "string" || !rootPath.trim()) {
        throw new Error("A valid workspace path is required.");
    }

    workspaceRoot = path.resolve(rootPath.trim());
    return workspaceRoot;
}

export function getWorkspaceRoot() {
    if (!workspaceRoot) {
        throw new Error("Workspace root has not been selected.");
    }
    return workspaceRoot;
}

export function resolveWorkspacePath(filePath = "") {
    const root = getWorkspaceRoot();

    const absolutePath = path.resolve(root, filePath);

    if (absolutePath !== root && !absolutePath.startsWith(root + path.sep)) {
        throw new Error("Access denied: path is outside workspace");
    }
    return absolutePath;
}