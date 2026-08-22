import { LuEllipsis, LuMessageSquare, LuShare2, LuSparkles } from 'react-icons/lu'
import { useSelector } from 'react-redux'

function Nav() {
    const { selectedConversation } = useSelector(state => state.conversation);
    const { messages } = useSelector(state => state.message);

    if (!selectedConversation) return null;

    return (
        <header className='glass-subtle h-16 flex items-center px-4 md:px-6 border-b gap-3 border-sky-100/80'>
            <div className='flex items-center justify-center w-8 h-8 rounded-lg bg-black/10 border border-white/30'>
                <LuMessageSquare size={15} className='text-sky-700' />
            </div>
            <div className='min-w-0 flex-1'>
                <div className='text-[14px] font-semibold text-slate-700 tracking-tight truncate'>
                    {selectedConversation?.title || "New Chat"}
                </div>
                <div className='text-[10px] font-medium text-slate-400 mt-0.5'>AI workspace</div>
            </div>
            <div className='hidden sm:flex items-center text-[10px] font-semibold text-sky-500 bg-black/10 border border-white/30 px-2.5 py-1 rounded-full'>
                <LuSparkles size={11} className='mr-1' /> {messages?.length || 0} messages
            </div>
            <button className='icon-control hidden sm:inline-flex' type='button' aria-label='Share conversation'><LuShare2 size={15} /></button>
            <button className='icon-control' type='button' aria-label='Conversation options'><LuEllipsis size={17} /></button>
        </header>
    )
}

export default Nav
