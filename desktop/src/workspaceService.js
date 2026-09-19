import { electronAPI } from "./electron.js";
import { getWorkspacePath, setWorkspacePath, clearWorkspacePath } from "./workspace.js";

export async function selectWorkspace() {
    if (!electronAPI?.selectWorkspace) {
        throw new Error("Workspace selection is only available in the Electron desktop app.");
    }

    const result = await electronAPI.selectWorkspace();

    if (!result || result.canceled || !result.path) {
        return null;
    }

    return setWorkspacePath(result.path);
}

export async function openWorkspaceInVSCode(workspacePath = getWorkspacePath()) {
    const path = typeof workspacePath === "string" ? workspacePath.trim() : "";

    if (!path) {
        throw new Error("No workspace has been selected.");
    }

    if (!electronAPI?.openVSCode) {
        throw new Error("VS Code integration is only available in the Electron desktop app.");
    }

    return electronAPI.openVSCode(path);
}

export function getSelectedWorkspace() {
    return getWorkspacePath();
}

export function removeWorkspace() {
    clearWorkspacePath();
}