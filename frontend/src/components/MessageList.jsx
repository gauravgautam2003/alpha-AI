import React from 'react'
import MessageBubble from './MessageBubble';
import { useSelector } from 'react-redux';

function MessageArea() {
    const { selectedConversation } = useSelector(state => state.conversation);
    const { messages } = useSelector(state => state.message);

    return (
        <div className='flex-1 overflow-y-auto px-6 py-6 space-y-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
            {messages.length == 0 || !selectedConversation ? (
                <>
                    <div className='h-[250px] flex flex-col items-center justify-center gap-2 text-center'>
                        <div className='flex flex-col gap-1.5'>
                            <h1 className='text-[20px] font-semibold text-state-200 uppercase tracking-tight'>Alpha AI</h1>
                            <p className='text-[15px] font-semibold text-state-400 tracking-tight'>What can I help you?</p>
                            <p className='text-[13px] text-state-600 max-w-[260px] leading-relaxed'>Ask me anything - code, ideas, explanations, or just a quick questions.</p>
                        </div>
                    </div>
                    <div className='flex flex-wrap justify-center gap-2 '>
                        {["Create a Netflix clone", "Explain Redis", "Build a dashboard"].map((s, idx) => (
                            <div key={s || idx} className='text-[13px] text-slate-400 bg-white/[0.04] border border-white/[0.07] px-3 py-1.5 rounded-lg hover:bg-white/[0.08] hover:text-slate-200 transition-colors duration-150 cursor-pointer'>
                                {s}
                            </div>
                        ))}

                    </div>
                </>
            ) : (
                <>
                    <div className='space-y-4'>
                        {messages?.map((msg, idx) => (
                            <div key={msg?._id || idx}>
                                <MessageBubble role={msg?.role} content={msg?.content} />
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

export default MessageArea