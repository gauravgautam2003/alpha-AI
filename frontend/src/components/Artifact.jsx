import { useState } from 'react'
import { LuCode, LuCopy, LuEye, LuPanelRightClose, LuPanelRightOpen } from "react-icons/lu";
import { useSelector } from 'react-redux';
import { easeInOut, motion } from "motion/react";

function Artifact() {
    const [collapsed, setCollapsed] = useState(false)
    const [tab, setTab] = useState("Code")
    const [activeFile, setActiveFile] = useState(0)

    const { artifacts } = useSelector(state => state.message)
    const artifact = artifacts?.[0]
    if(artifacts?.length == 0) return;


    return (
        <motion.div
            initial={{ width: 350 }}
            animate={{ width: collapsed ? 48 : 350 }}
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
                                <button className='flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-slate-400 hover:text-slate-200 rounded-lggap-1.5 px-2.5 py-1.5 text-[11px] font-mediumbg-transparent border-none cursor-pointer'>
                                    <LuCopy size={15} />
                                </button>
                            </div>

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
                        </div>

                    </div>
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
