import MessageBubble from './MessageBubble';
import { useSelector } from 'react-redux';

function MessageArea({ onSuggestion }) {
    const { selectedConversation } = useSelector(state => state.conversation);
    const { messages } = useSelector(state => state.message);

    return (
        <div className='chat-scrollbar flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-2'>
            {messages.length == 0 || !selectedConversation ? (
                <>
                    <div className='min-h-[300px] flex flex-col items-center justify-center gap-5 text-center'>
                        <div className='mirror-surface flex items-center justify-center w-16 h-16 rounded-[1.35rem] text-sky-700'>
                            <span className='text-2xl'>✦</span>
                        </div>
                        <div className='flex flex-col gap-2'>
                            <p className='text-[11px] font-bold uppercase tracking-[0.24em] text-sky-500'>Your intelligent workspace</p>
                            <h1 className='text-2xl md:text-[28px] font-semibold text-sky-950 tracking-tight'>What shall we create today?</h1>
                            <p className='text-[13px] text-slate-500 max-w-[320px] leading-relaxed mx-auto'>Explore ideas, write code, research a topic, or turn an outline into something useful.</p>
                        </div>
                    </div>
                    <div className='max-w-2xl mx-auto flex flex-wrap justify-center gap-2.5'>
                        {["Create a Netflix clone", "Explain Redis simply", "Build a modern dashboard", "Help me plan a project"].map((s, idx) => (
                            <button key={s || idx} type='button' onClick={() => onSuggestion(s)} className='glass-button text-[13px] text-slate-600 px-3.5 py-2 rounded-xl transition-colors duration-150 cursor-pointer'>
                                {s}
                            </button>
                        ))}

                    </div>
                </>
            ) : (
                <>
                    <div className='max-w-4xl mx-auto space-y-5 pb-4'>
                        {messages?.map((msg, idx) => (
                            <div key={msg?._id || idx}>
                                <MessageBubble role={msg?.role} content={msg?.content} images={msg.images || []} />
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

export default MessageArea
