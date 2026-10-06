import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendRoot = path.dirname(fileURLToPath(import.meta.url));
const gatewayPort = process.env.PORT || "10000";
const services = [
    { name: "auth", directory: "services/auth", port: "8001" },
    { name: "chat", directory: "services/chat", port: "8002" },
    { name: "agent", directory: "services/agent", port: "8003" },
    { name: "billing", directory: "services/billing", port: "8004" },
    {
        name: "gateway",
        directory: "gateway",
        port: gatewayPort,
        env: {
            AUTH_SERVICE: "127.0.0.1:8001",
            CHAT_SERVICE: "127.0.0.1:8002",
            AGENT_SERVICE: "127.0.0.1:8003",
            BILLING_SERVICE: "127.0.0.1:8004",
        },
    },
];

const children = new Set();
let shuttingDown = false;
let exitCode = 0;

function shutdown(code) {
    if (shuttingDown) {
        if (code !== 0) {
            exitCode = code;
        }
        return;
    }

    shuttingDown = true;
    exitCode = code;

    for (const child of children) {
        child.kill("SIGTERM");
    }

    const forceExit = setTimeout(() => {
        for (const child of children) {
            child.kill("SIGKILL");
        }
        process.exit(exitCode);
    }, 10_000);
    forceExit.unref();

    if (children.size === 0) {
        process.exit(exitCode);
    }
}

for (const service of services) {
    const child = spawn(process.execPath, ["index.js"], {
        cwd: path.join(backendRoot, service.directory),
        env: {
            ...process.env,
            PORT: service.port,
            ...service.env,
        },
        stdio: "inherit",
    });

    children.add(child);

    child.on("error", (error) => {
        console.error(`Failed to start ${service.name}:`, error);
        shutdown(1);
    });

    child.on("exit", (code, signal) => {
        children.delete(child);

        if (!shuttingDown) {
            console.error(
                `${service.name} exited unexpectedly (code=${code}, signal=${signal}).`
            );
            shutdown(code || 1);
        } else if (children.size === 0) {
            process.exit(exitCode);
        }
    });
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
