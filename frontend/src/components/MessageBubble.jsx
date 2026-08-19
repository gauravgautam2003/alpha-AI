import React from 'react'
import Markdown from "react-markdown"
import { LuBot, LuUserRound } from 'react-icons/lu'



function MessageBubble({role, content}) {
    const isUser = role === "user"

    const formattedContent = typeof content === 'string'
        ? content
        : typeof content === 'object' && content !== null
            ? (content.content || content.text || content.message || JSON.stringify(content, null, 2))
            : String(content ?? '');

    return (
        <div className={`flex items-end gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
            {!isUser && <div className='glass-panel flex items-center justify-center shrink-0 w-8 h-8 rounded-xl text-sky-700'><LuBot size={16} /></div>}
            <div className={`chat-copy max-w-[84%] md:max-w-[72%] px-4 py-3 rounded-2xl shadow-sm
                ${
                    isUser 
                    ? "blue-action text-white rounded-tr-sm"
                    : "glass-panel border border-white/80 text-slate-700 rounded-tl-sm"
                }`}>
                
                <Markdown>
                    {formattedContent}
                </Markdown>
            </div>
            {isUser && <div className='flex items-center justify-center shrink-0 w-8 h-8 rounded-xl bg-sky-200/80 border border-white text-sky-700'><LuUserRound size={15} /></div>}
        </div>
    )
}

export default MessageBubble
