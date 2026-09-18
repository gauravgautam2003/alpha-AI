const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    isElectron: true,

    selectWorkspace: () => {
        return ipcRenderer.invoke("workspace:select");
    },

    openVSCode: (workspacePath) => {
        return ipcRenderer.invoke("vscode:open", workspacePath);
    }
});