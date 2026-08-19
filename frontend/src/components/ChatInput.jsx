import React, { useState } from 'react'
import { LuCode, LuFileText, LuGlobe, LuImage, LuMessageSquare, LuMic, LuPaperclip, LuPresentation, LuSend, LuZap } from "react-icons/lu";
import { useDispatch, useSelector } from "react-redux"
import { sendMessage } from '../features/sendMessage';
import { addMessage } from '../redux/messageSlice';
import { createConversation } from '../features/createConversation';
import { addConversation, setConversationTitle, setSelectedConversation } from '../redux/conversationSlice';
import { updateConversation } from '../features/updateConversation';

function ChatInput() {
    const [value, setValue] = useState("");
    const { selectedConversation } = useSelector(state => state.conversation);
    const [selectedAgent, setSelectedAgent] = useState("Auto");
    const { messages } = useSelector(state => state.message);
    const dispatch = useDispatch();


    const handleSendMessage = async () => {
        let conversation = selectedConversation;
        if (!conversation) {
            const conv = await createConversation();
            dispatch(setSelectedConversation(conv));
            dispatch(addConversation(conv));
            conversation = conv;
        }

        if (conversation.title == "New Chat") {
            const conv = await updateConversation({ id: conversation?._id, title: value.trim() });
            dispatch(setConversationTitle({ conversationId: conversation._id, title: value.slice(0, 40) }))
        }
        const payload = {
            prompt: value.trim(),
            conversationId: conversation?._id
        }

        dispatch(addMessage({ role: "user", content: value.trim() }))
        setValue("")

        const data = await sendMessage(payload)
        const responseText = typeof data === 'string'
            ? data
            : (data?.aiResponse || data?.content || data?.text || data?.message || JSON.stringify(data));

        dispatch(addMessage({ role: "assistant", content: responseText }))
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
        <div className='w-full overflow-hidden px-3 md:px-5 py-4 border-t border-white/[0.08] bg-[#0d0f14] shrink-0'>
            <div className='flex flex-col gap-2 bg-white/[0.03] border border-white/[0.07] rounded-[10px] px-4 pt-3.5 pb-3'>
                <div className='flex max-w-[80%] gap-2 flex-wrap pr-3'>
                    {agents.map((agent) => {
                        const isActive = selectedAgent === agent.label
                        const Icon = agent.icon

                        return (
                            <div onClick={() => setSelectedAgent(agent.label)} className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium border transition-all cursor-pointer
                            ${isActive ? "bg-linear-to-r from-indigo-500 to-violet-600 text-white border-transperent shadow-[0_1px_8px_rgba(99,102,241,.35)]" : "bg-white/[0.03] text-slate-400 border-white/[0.06] hover:bg-white/[0.07] hover"}`}>
                                <Icon size={14} className={`${isActive ? 'text-white' : 'text-slate-300'}`} />
                                <span className={` ${isActive ? 'text-white' : 'text-slate-300'}`}>
                                    {agent.label}
                                </span>
                            </div>
                        )
                    })}
                </div>

                <textarea
                    placeholder='Ask Anything...'
                    onChange={(e) => setValue(e.target.value)}
                    value={value}
                    className='w-full bg-transparent outline-none resize-none text-[14px] text-slate-200 placeholder:text-slate-600 leading-relaxed [scroll-width:none] [&::-webkit-scrollbar]:hidden disabled:opacity-50 ' />

                <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-1'>
                        <button className='flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 hover:textslate-400 hover:bg-white/[0.05] border border-transparent hover:border-white/[0.06] transition-all duration-150 bg-transparent cursor-pointer'>
                            <LuPaperclip size={16} />
                        </button>
                        <button className='flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 hover:textslate-400 hover:bg-white/[0.05] border border-transparent hover:border-white/[0.06] transition-all duration-150 bg-transparent cursor-pointer'>
                            <LuMic size={16} />
                        </button>
                    </div>

                    <button disabled={!value}
                        onClick={handleSendMessage}
                        className={`flex items-center justify-center w-8 h-8 cursor-pointer rounded-lg border-none transition-all duration-150 ${value.trim() ? "bg-linear-to-br from-indigo-500 to-violet-700 text-white hover:opacity-90" : "text-slate-600 bg-white/[0.06] cursor-not-allowed"}`}>
                        <LuSend size={15} />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ChatInput