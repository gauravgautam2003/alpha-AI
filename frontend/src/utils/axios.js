import axios from "axios";

const configuredBaseURL =
    import.meta.env.VITE_SERVER_URL || import.meta.env.VITE_API_URL;

if (
    !configuredBaseURL ||
    configuredBaseURL.includes("VITE_API_URL")
) {
    throw new Error(
        "Set VITE_SERVER_URL in Vercel to the deployed backend origin (for example, https://alpha-ai-backend.onrender.com)."
    );
}

let baseURL;

try {
    const parsedBaseURL = new URL(configuredBaseURL);
    if (!["http:", "https:"].includes(parsedBaseURL.protocol)) {
        throw new Error("Unsupported URL protocol");
    }
    baseURL = configuredBaseURL.replace(/\/+$/, "");
} catch {
    throw new Error(
        "VITE_SERVER_URL must be an absolute HTTP(S) backend URL, not a relative path."
    );
}

const api = axios.create({
    baseURL,
    withCredentials: true
})

export default api;