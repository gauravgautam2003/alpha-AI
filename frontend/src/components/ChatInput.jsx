import { useRef, useState } from 'react'
import { LuCode, LuFileText, LuGlobe, LuImage, LuMessageSquare, LuMic, LuPaperclip, LuPresentation, LuSend, LuX, LuZap } from "react-icons/lu";
import { useDispatch, useSelector } from "react-redux"
import { sendMessage } from '../features/sendMessage';
import { addMessage, setArtifacts, setIsLoading } from '../redux/messageSlice';
import { createConversation } from '../features/createConversation';
import { addConversation, setConversationTitle, setSelectedConversation } from '../redux/conversationSlice';
import { updateConversation } from '../features/updateConversation';
import { motion } from 'motion/react';

function ChatInput({ draft, onDraftChange, onRequireAuth }) {
    const { userData } = useSelector(state => state.user);
    const { selectedConversation } = useSelector(state => state.conversation);
    const [selectedAgent, setSelectedAgent] = useState("Auto");
    const { isLoading } = useSelector(state => state.message)
    const [isSending, setIsSending] = useState(false);
    const [requestError, setRequestError] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const fileRef = useRef(null)
    const dispatch = useDispatch();
    dispatch(setIsLoading(true))


    const handleSendMessage = async () => {
        const value = draft.trim();
        if (!value || isSending) return;

        if (!userData) {
            onRequireAuth?.();
            return;
        }

        setIsSending(true);
        setRequestError("");

        try {
            let conversation = selectedConversation;

            if (!conversation) {
                const conv = await createConversation();
                if (!conv?._id) {
                    throw new Error("Conversation could not be created");
                }

                dispatch(setSelectedConversation(conv));
                dispatch(addConversation(conv));
                conversation = conv;
            }

            if (conversation.title == "New Chat") {
                await updateConversation({ id: conversation._id, title: value });
                dispatch(setConversationTitle({ conversationId: conversation._id, title: value.slice(0, 40) }));
            }

            dispatch(addMessage({ role: "user", content: value }));
            onDraftChange("");


            const formData = new FormData()
            formData.append("prompt", value.trim())
            formData.append("conversationId", conversation._id)
            formData.append("agent", selectedAgent.toLowerCase())
            if (selectedFile) {
                formData.append("file", selectedFile)
            }

            const data = await sendMessage(formData);
            dispatch(setIsLoading(false))


            const responseText = typeof data === 'string'
                ? data
                : (data?.aiResponse || data?.answer || data?.content || data?.text || data?.message || JSON.stringify(data));

            setSelectedFile(null)
            dispatch(setArtifacts(data?.artifacts || []));
            dispatch(addMessage({
                role: "assistant",
                content: responseText,
                images: data?.images || [],
                artifacts: data?.artifacts || []
            }));
        } catch (error) {
            console.error("send message error", error);
            setRequestError("Message could not be sent. Please try again.");
        } finally {
            setIsSending(false);
        }
    }

    const agents = [
        {
            id: "auto",
            icon: LuZap,
            label: "Auto"
        },
        {
            id: "chat",
            icon: LuMessageSquare,
            label: "Chat"
        },
        {
            id: "coding",
            icon: LuCode,
            label: "Coding"
        },
        {
            id: "pdf",
            icon: LuFileText,
            label: "PDF"
        },
        {
            id: "ppt",
            icon: LuPresentation,
            label: "PPT"
        },
        {
            id: "image",
            icon: LuImage,
            label: "Image"
        },
        {
            id: "search",
            icon: LuGlobe,
            label: "Search"
        }
    ]
    return (
        <div className='w-full overflow-hidden px-3 md:px-6 pb-5 pt-2 shrink-0'>
            <div className='mirror-surface max-w-4xl mx-auto flex flex-col gap-3 rounded-3xl px-4 pt-3.5 pb-3'>
                <div className='flex gap-2 flex-wrap pr-3'>
                    {agents.map((agent) => {
                        const isActive = selectedAgent === agent.label
                        const Icon = agent.icon

                        return (
                            <button key={agent.id} type='button' onClick={() => setSelectedAgent(agent.label)} className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-semibold border transition-all cursor-pointer
                            ${isActive ? "blue-action border-transparent" : "glass-button text-slate-500"}`}>
                                <Icon size={14} className={`${isActive ? 'text-white' : 'text-sky-600'}`} />
                                <span className={` ${isActive ? 'text-white' : 'text-slate-600'}`}>
                                    {agent.label}
                                </span>
                            </button>
                        )
                    })}
                </div>

                {
                    selectedFile && (
                        <div className="my-3">
                            <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                                {
                                    selectedFile.type === "application/pdf" ? <LuFileText className='text-red-400' size={14} /> : selectedFile.type.startsWith("image/") && <img src={URL.createObjectURL(selectedFile)} alt="image" className='h-10 w-10 rounded-xl object-cover mt-3' />
                                }
                                <div>
                                    <p className='text-xs text-whte'>{selectedFile?.name}</p>
                                    <p className='text-[10px] text-slate-500'>{Math.ceil(selectedFile.size)} KB</p>
                                </div>

                                <button className='mt-2' onClick={() => {
                                    setSelectedFile(null); fileRef.current.value = ""
                                }}><LuX size={14} className='text-slate-500 hover:text-white' /></button>
                            </div>
                        </div>
                    )
                }

                <textarea
                    placeholder='Ask Anything...'
                    onChange={(e) => onDraftChange(e.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            handleSendMessage();
                        }
                    }}
                    value={draft}
                    rows={2}
                    className='w-full mt-6 bg-transparent outline-none resize-none text-[15px] text-slate-700 placeholder:text-slate-400 leading-7 [scroll-width:none] [&::-webkit-scrollbar]:hidden disabled:opacity-50 ' />

                {requestError && <p role='alert' className='text-xs text-red-400'>{requestError}</p>}

                <div className='flex items-center justify-between gap-3'>
                    <div className='flex items-center gap-1'>

                        <input type="file" accept='pdf, image/*' hidden ref={fileRef} onChange={(e) => {
                            const file = e.target.file[0]
                            if (file) {
                                setSelectedFile(file)
                            }
                        }} />

                        <button type='button' className='icon-control w-8 h-8 rounded-lg text-slate-500' onClick={() => fileRef.current.click()}>
                            <LuPaperclip size={16} />
                        </button>
                        <button type='button' className='icon-control w-8 h-8 rounded-lg text-slate-500'>
                            <LuMic size={16} />
                        </button>
                    </div>

                    <div className='hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-slate-400'>
                        <span className='w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(74,222,128,.16)]' />
                        Alpha model online
                    </div>

                    <motion.button type='button' whileTap={{ scale: 0.92 }} whileHover={{ scale: draft.trim() ? 1.04 : 1 }} disabled={isSending || !draft.trim() || isLoading}
                        onClick={handleSendMessage}
                        className={`flex items-center justify-center w-9 h-9 cursor-pointer rounded-xl border-none transition-all duration-150 ${draft.trim() ? "blue-action" : "text-slate-400 bg-white/10 border border-sky-100 cursor-not-allowed"}`}>
                        <LuSend size={15} />
                    </motion.button>
                </div>
            </div>
        </div>
    )
}

export default ChatInput
