import React from 'react'

const DownloadDesktopButton = () => {
    const handleDownload = () => { window.location.href = "YOUR_DESKTOP_DOWNLOAD_URL"; };
    return (
        <button type="button" onClick={handleDownload} >
            Download Desktop
        </button>
    )
}

export default DownloadDesktopButton