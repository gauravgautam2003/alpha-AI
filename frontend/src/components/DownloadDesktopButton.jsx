import React, { useEffect, useState } from "react";
import { LuDownload, LuGithub, LuInfo, LuCheck } from "react-icons/lu";

const DOWNLOAD_URL = "https://github.com/gauravgautam2003/alpha-AI/releases/download/v1.0.1/Alpha.AI.Setup.1.0.1.exe";
const GITHUB_URL = "https://github.com/gauravgautam2003/alpha-AI";
const APP_VERSION = "v1.0.1";

const DOWNLOAD_STORAGE_KEY = `alpha-ai-downloaded-${APP_VERSION}`;

const DownloadDesktopButton = () => {

    const [downloaded, setDownloaded] = useState(false);

    // Check download status when component loads
    useEffect(() => {
        const alreadyDownloaded = localStorage.getItem(DOWNLOAD_STORAGE_KEY) === "true";
        setDownloaded(alreadyDownloaded);
    }, []);

    const handleDownload = () => {
        // Mark as downloaded
        localStorage.setItem(DOWNLOAD_STORAGE_KEY, "true");
        setDownloaded(true);

        // Start download
        window.location.href = DOWNLOAD_URL;

        // Enable again after a few seconds
        setTimeout(() => {
            setDownloaded(false);
        }, 5000);
    };

    const handleGithub = () => {
        window.open(GITHUB_URL, "_blank", "noopener,noreferrer");
    };

    return (
        <div className="flex flex-col items-center gap-3">

            {/* Download Button */}
            <button
                type="button"
                onClick={handleDownload}
                disabled={downloaded}
                className={`flex items-center gap-4 mirror-surface py-3 px-4 rounded-lg font-extrabold tracking-[0.24em] transition-colors duration-150 ${downloaded
                        ? "cursor-not-allowed text-green-400 opacity-70"
                        : "text-sky-400 hover:text-sky-300"
                    }`}
            >
                {downloaded ? (
                    <LuCheck size={18} />
                ) : (
                    <LuDownload size={18} />
                )}

                {downloaded
                    ? "Downloaded"
                    : "Download for Windows"}
            </button>

            {/* Version */}
            <p className="text-xs tracking-wide text-gray-400">
                Windows · {APP_VERSION}
            </p>

            {/* GitHub Source */}
            <button
                type="button"
                onClick={handleGithub}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors duration-150"
            >
                <LuGithub size={16} />
                View Source Code
            </button>

            {/* SmartScreen Information */}
            <div className="mt-3 max-w-md rounded-lg border border-white/10 bg-white/5 p-4 text-left">
                <div className="flex items-start gap-2">
                    <LuInfo
                        size={18}
                        className="mt-0.5 shrink-0 text-sky-400"
                    />

                    <div>
                        <h3 className="text-sm font-semibold text-white">
                            Windows SmartScreen notice
                        </h3>

                        <p className="mt-2 text-xs leading-5 text-gray-400">
                            Alpha AI is a newly released Windows application
                            and is currently not code-signed with a Microsoft-
                            recognized publisher certificate. Windows may
                            therefore display an "unrecognized app" warning.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DownloadDesktopButton;