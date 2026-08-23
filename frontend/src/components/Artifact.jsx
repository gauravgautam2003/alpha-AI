import { useState } from 'react'
import { LuCheck, LuCode, LuCopy, LuEye, LuPanelRightClose, LuPanelRightOpen } from "react-icons/lu";
import { useSelector } from 'react-redux';
import { easeInOut, motion } from "motion/react";
import Editor from "@monaco-editor/react"

function Artifact() {
    const [collapsed, setCollapsed] = useState(false)
    const [tab, setTab] = useState("Code")
    const [activeFile, setActiveFile] = useState(0)
    const [copyCode, setCopyCode] = useState("");

    const { artifacts } = useSelector(state => state.message)
    const artifact = artifacts?.[0]
    if (artifacts?.length == 0) return;


    
    const file = artifacts[0]?.files[activeFile]
    const htmlFile = artifacts[0]?.files?.find(file => file.name === "index.html")
    const cssFile = artifacts[0]?.files?.find(file => file.name === "style.css")
    const scriptFile = artifacts[0]?.files?.find(file => file.name === "script.js")
    const canPreview = Boolean(htmlFile)
    
    const handleCopy = async () => {
        await navigator.clipboard.writeText(file?.content || "")
        setCopyCode(true)
        setTimeout(() => {
            setCopyCode(false)
        }, 2000)
    }

    const previewDoc = `
        <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                ${cssFile?.content || ""}
            </style>
            </head>
            <body>
                ${htmlFile?.content || ""}
                <script>
                    ${scriptFile?.content || ""}
                </script>
            </body>
        </html>
    `

    const detactLanguage = (fileName = "") => {
        const name = fileName.toLowerCase();

        if (name.endsWith(".html")) return "html";
        if (name.endsWith(".css")) return "css";
        if (name.endsWith(".js")) return "javascript";
        if (name.endsWith(".ts")) return "typescript";
        if (name.endsWith(".py")) return "python";
        if (name.endsWith(".jsx")) return "javascript";
        if (name.endsWith(".tsx")) return "typescript";
        if (name.endsWith(".json")) return "json";
        if (name.endsWith(".java")) return "java";
        if (name.endsWith(".cpp")) return "cpp";
        if (name.endsWith(".c")) return "c";
        return "plainText"
    }

    return (
        <motion.div
            initial={{ width: 400 }}
            animate={{ width: collapsed ? 48 : 400 }}
            transition={{
                duration: 0.25,
                ease: easeInOut
            }}
            className='glass-panel hidden xl:flex h-full border-l border-white/70 flex-col overflow-hidden shrink-0'
        >
            {!collapsed ? (
                <div className='flex flex-col h-full'>
                    <div className='h-14 px-4 border-b border-white/10  flex items-center gap-4 shrink-0'>
                        <button className='flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/20 transition-colors duration-150 bg-transparent border-none cursor-pointer shrink-0' onClick={() => setCollapsed(true)}>
                            <LuPanelRightClose size={16} />
                        </button>

                        <div className='flex items-center gap-2 flex-1 min-w-0'>
                            <div className='flex items-center justify-center w-6 h-6 rounded-md bg-indigo-500/10 border border-indigo-500/20 shrink-0'>
                                <LuCode className='text-indigo-400' />
                            </div>
                            <div className='text-[13px] font-medium text-slate-200 truncate'>
                                {artifact?.title ?? 'Artifacts'}
                            </div>

                            <div className='flex items-center gap-1 shrink-0'>
                                <button
                                    onClick={handleCopy}
                                    className='flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-slate-400 hover:text-slate-200 rounded-lggap-1.5 px-2.5 py-1.5 text-[11px] font-mediumbg-transparent border-none cursor-pointer'>
                                    {copyCode ? <LuCheck size={15} /> : <LuCopy size={15} />}
                                </button>
                            </div>

                            {
                                canPreview && (
                                    <div className='flex items-center gap-1 border border-white/10 p-1 rounded-lg'>
                                        <button
                                            onClick={() => setTab("Code")}
                                            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium rounded-md transition-colors duration-150 ${tab == "Code" ? "bg-indigo-500 text-white" : "text-slate-500 hover:text-slate-200"}`}>
                                            <LuCode size={11} /> Code
                                        </button>
                                        <button
                                            onClick={() => setTab("Preview")}
                                            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium rounded-md transition-colors duration-150 ${tab == "Preview" ? "bg-indigo-500 text-white" : "text-slate-500 hover:text-slate-200"}`}>
                                            <LuEye size={11} /> Preview
                                        </button>
                                    </div>
                                )
                            }
                        </div>

                    </div>

                    {
                        tab == "Code" && (
                            <div className='flex border-b border-white/10 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0'>
                                {
                                    artifacts[0]?.files?.map((file, index) => (
                                        <button
                                            onClick={() => setActiveFile(index)}
                                            className={`px-4 py-2.5 text-[11px] font-medium whitespace-nowrap transition-colors duration-150 border-r border-white/10 relative cursor-pointer bg-transparent ${activeFile == index ? "text-indigo-500" : "text-slate-500 hover:text-slate-200"}`}>
                                            {file.name}
                                            {activeFile == index && <div className='absolute bottom-0 right-0 left-0 h-[2px] bg-indigo-500 rounded-t-full' />}
                                        </button>
                                    ))
                                }
                            </div>
                        )
                    }

                    <div className='flex-1 overflow-hidden'>
                        {
                            (tab == "Preview" && canPreview) ?
                                (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.5 }}
                                        className='w-full h-full'
                                    >
                                        <iframe title='preview' sandbox='allow-scripts' srcDoc={previewDoc} className='h-full w-full bg-white' />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.5 }}
                                        className='w-full h-full'
                                    >
                                        <Editor
                                            theme='vs-dark'
                                            language={detactLanguage(file?.name)}
                                            value={file?.content}
                                            options={{
                                                readOnly: true,
                                                minimap: {
                                                    enabled: false
                                                },
                                                fontSize: 13,
                                                wordWrap: "on",
                                                automaticLayout: true,
                                                scrollBeyondLastLine: false,
                                                padding: {
                                                    top: 16
                                                },
                                                lineNumbers: "on",
                                                renderLineHighlight: "none"
                                            }}
                                        />
                                    </motion.div>
                                )
                        }
                    </div>
                </div>
            ) : (
                <div className='hidden lg:flex h-full border-l border-white/10 flex-col items-center py-4 gap-3 shrink-0'>
                    <button className='flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/20 transition-colors duration-150 bg-transparent border-none cursor-pointer shrink-0' onClick={() => setCollapsed(false)}>
                        <LuPanelRightOpen size={16} />
                    </button>

                    <div className='flex items-center gap-2 flex-1 min-w-0'
                        style={{
                            writingMode: "vertical-lr",
                            transform: "rotate(180deg)"
                        }}>
                        <div className='text-[10px] font-medium text-slate-600 tracking-widest uppercase whitespace-nowrap '>
                            {artifact?.title ?? 'Artifacts'}
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    )
}

export default Artifact
