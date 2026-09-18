const STORAGE_KEY = "alpha-workspace-path";

export function getWorkspacePath() {
    return localStorage.getItem(STORAGE_KEY) || "";
}

export function setWorkspacePath(workspacePath) {
    const normalizedPath =
        typeof workspacePath === "string"
            ? workspacePath.trim()
            : "";

    if (!normalizedPath) {
        localStorage.removeItem(STORAGE_KEY);
        return "";
    }

    localStorage.setItem(
        STORAGE_KEY,
        normalizedPath
    );

    return normalizedPath;
}

export function clearWorkspacePath() {
    localStorage.removeItem(STORAGE_KEY);
}