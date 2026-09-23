import React from 'react'

const DownloadDesktopButton = () => {
    const handleDownload = () => { window.location.href = "YOUR_DESKTOP_DOWNLOAD_URL"; };
    return (
        <button type="button" onClick={handleDownload} className='mirror-surface py-3 px-4 rounded-lg font-extrabold tracking-[0.24em] text-sky-400  hover:text-sky-300 transition-colors duration-150'>
            Download Desktop
        </button>
    )
}

export default DownloadDesktopButton