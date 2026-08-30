import { useState } from "react";
import { LuCheck, LuCopy, LuDownload, LuExternalLink, LuX } from 'react-icons/lu';
import Markdown from "react-markdown";
import { Prism as SyntaxHighLighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import { AnimatePresence, motion } from "motion/react";



function MessageBubble({ role, content, images = [], artifacts = [] }) {
    const [lightBox, setLightBox] = useState(null);
    const [copyCode, setCopyCode] = useState("");

    const copySelectCode = async (code) => {
        await navigator.clipboard.writeText(code)
        setCopyCode(code)
        setTimeout(() => {
            setCopyCode("")
        }, 2000)
    }
    const isUser = role === "user"

    const formattedContent = typeof content === 'string'
        ? content
        : typeof content === 'object' && content !== null
            ? (content.content || content.text || content.message || JSON.stringify(content, null, 2))
            : String(content ?? '');

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className={`flex items-end gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
        >
            <div className={`w-fit max-w-[92vw] md:max-w-[72%] px-4 py-2.5 rounded-2xl break-words overflow-hidden leading-relaxed
                ${isUser
                    ? "blue-action text-white rounded-tr-sm"
                    : "text-slate-700 rounded-tl-sm"
                }`}>

                {images.length > 0 && (
                    <div className='flex flex-wrap mt-4 gap-3'>
                        {images.map((img, idx) => (
                            <div key={idx}>
                                <motion.img
                                    initial={{ opacity: 0, scale: 0.96 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                                    src={img}
                                    loading='lazy'
                                    onClick={() => setLightBox(img)}
                                    onError={(e) => e.currentTarget.remove()}
                                    className='w-[400px] max-w-full h-auto rounded-xl object-cover border border-white/10 cursor-zoom-in hover:opacity-90 transition'
                                />
                            </div>
                        ))}
                    </div>
                )}
                {artifacts.length > 0 && (
                    <div className='flex flex-wrap gap-2 mt-3'>
                        {artifacts.filter((artifact) => artifact?.url).map((artifact) => (
                            <a
                                key={artifact.id || artifact.url}
                                href={artifact.url}
                                download
                                target='_blank'
                                rel='noreferrer'
                                className='inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-green-600 bg-transparent border-0 hover:bg-transparent'
                            >
                                <LuDownload size={14} />
                                download {String(artifact.type || "file").toLowerCase()}
                            </a>
                        ))}
                    </div>
                )}
                <Markdown remarkPlugins={[remarkGfm]}
                    components={{
                        h1: ({ children }) => (
                            <h1 className="text-2xl font-bold mt-5 mb-3">{children}</h1>
                        ),
                        h2: ({ children }) => (
                            <h2 className="text-xl font-semibold mt-4 mb-2">{children}</h2>
                        ),
                        h3: ({ children }) => (
                            <h3 className="text-lg font-bold mt-3 mb-2">{children}</h3>
                        ),
                        p: ({ children }) => (
                            <p className="mb-3 whitespace-pre-wrap break-words">{children}</p>
                        ),
                        ul: ({ children }) => (
                            <ul className="list-disc pl-5 space-y-1 my-2">{children}</ul>
                        ),
                        ol: ({ children }) => (
                            <ol className="list-decimal pl-5 space-y-1 my-2">{children}</ol>
                        ),
                        table: ({ children }) => (
                            <div className="overflow-x-auto my-4">
                                <table className="min-w-full border border-white/10">
                                    {children}
                                </table>
                            </div>
                        ),
                        th: ({ children }) => (
                            <th className="border border-white/10 bg-white/5 px-3 py-2 text-left">{children}</th>
                        ),
                        td: ({ children }) => (
                            <td className="border border-white/10 bg-white/5 px-3 py-2 ">{children}</td>
                        ),
                        a: ({ href, children }) => (
                            <a href={href} target="_blank" rel="noreferrer" className="text-indigo-400 underline inline-flex items-center gap-1">
                                {children}
                                <LuExternalLink size={14} />
                            </a>
                        ),
                        code: ({ className, children }) => {
                            const value = String(children).trim();
                            if (!className) {
                                return (
                                    <code className="px-1.5 py-0.5 rounded bg-white/10 text-indigo-300">
                                        {value}
                                    </code>
                                )
                            }

                            const language = className?.replace("language-", "");

                            return (
                                <div className="overflow-hidden rounded-xl border border-white/10 bg-[#111318]">
                                    <div className="flex items-center justify-between bg-[#1b1d24] border-b border-white/10 px-4 py-2">
                                        <span className="uppercaase text-sm text-slate-400">
                                            {language}
                                        </span>
                                        <button className="flex items-center gap-1 text-xs" onClick={() => copySelectCode(value)}>
                                            {
                                                copyCode == value ?
                                                    <>
                                                        <LuCheck size={14} />
                                                        Copied
                                                    </> :
                                                    <>
                                                        <LuCopy size={14} />
                                                        Copy
                                                    </>
                                            }
                                        </button>
                                    </div>
                                    <SyntaxHighLighter
                                        language={language}
                                        style={oneDark}
                                        wrapLongLines
                                        showLineNumbers
                                        customStyle={{
                                            margin: 0,
                                            padding: "16px",
                                            background: "#0d1117",
                                            fontSize: "13px",
                                        }}
                                    >
                                        {value}
                                    </SyntaxHighLighter>
                                </div>
                            )
                        }
                    }}
                >
                    {formattedContent}
                </Markdown>
            </div>

            <AnimatePresence>
                {lightBox && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className='fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6'
                    >
                        <button className='absolute top-5 right-5 text-white/80 hover:text-white bg-white/10 rounded-full p-2'
                            onClick={() => setLightBox(null)}>
                            <LuX />
                        </button>
                        <motion.img
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ duration: 0.2 }}
                            src={lightBox}
                            className='max-w-[90vw] max-h-[85vh] rounded-xl border border-white/10 shadow-2xl object-contain'
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

export default MessageBubble
