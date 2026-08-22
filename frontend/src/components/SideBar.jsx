import { useEffect, useState } from 'react'
import { LuCoins, LuLogOut, LuMessageSquare, LuPanelLeft, LuPanelRight, LuPlus, LuSparkles } from "react-icons/lu";
import { HiOutlinePencilAlt, HiPlus } from "react-icons/hi";
import { FaUser } from "react-icons/fa";
import { useDispatch, useSelector } from 'react-redux';
import { setConversations, setSelectedConversation } from '../redux/conversationSlice';
import { getConversations } from '../features/getConversations';
import { logOut } from '../features/logOut';
import { setUserData } from '../redux/userSlice';



function SideBar() {
    const [collapsed, setCollapsed] = useState(false);
    const [imageError, setImageError] = useState(false);

    const { conversations, selectedConversation } = useSelector(state => state.conversation);
    const { userData } = useSelector(state => state.user);
    const dispatch = useDispatch();

    useEffect(() => {
        const getConv = async () => {
            const data = await getConversations();
            dispatch(setConversations(data));
        }
        getConv();
    }, [dispatch, userData?._id])

    const handleLogout = async () => {
        try {
            await logOut();
            dispatch(setUserData(null));
        } catch (error) {
            console.error("logout error", error);
        }
    };

    if (collapsed) {
        return (
            <>
                <div className='glass-panel sidebar-glass hidden lg:flex flex-col items-center w-[56px] h-screen border-r border-white/70 py-4 gap-1 shrink-0'>
                    <button className='flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/[0.05] transition-colors duration-150 bg-transparent border-none cursor-pointer mb-1 '
                        onClick={() => setCollapsed(false)}
                    >
                        <LuPanelRight />
                    </button>
                    <button className='flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/[0.05] transition-colors duration-150 bg-transparent border-none cursor-pointer mb-1 '
                        onClick={() => dispatch(setSelectedConversation(null))}>
                        <LuPlus size={18} />
                    </button>

                    <div className='flex-1 overflow-y-auto px-2.5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pt-5'>
                        {conversations.map((conv, idx) => {
                            let isActive = selectedConversation?._id == conv?._id;
                            return (
                                <div
                                    key={conv?._id || idx}
                                    onClick={() => dispatch(setSelectedConversation(conv))}
                                    className={`flex items-center gap-1 cursor-pointer mb-0.5 px-2 py-2 rounded-[10px] border transition-colors duration-150 ${isActive ? "bg-indigo-500/10 border-indigo-500/[0.18]" : "bg-transparent border-transparent"}`}>

                                    <div className={`flex items-center justify-center shrink-0 w-[28px] h-[28px] rounded-lg transition-colors duration-150 ${isActive ? "bg-indigo-500/15 text-indigo-400" : "bg-white/[0.05] text-slate-500"}`}>
                                        <LuMessageSquare />
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className='relative shrink-0'>
                        {
                            (userData?.avatar && !imageError) ?
                                <img className='w-8 h-8 rounded-[10px] object-cover border-2 border-indigo-500/25' src={userData?.avatar} alt={"image"} onError={() => setImageError(true)} />
                                :
                                <div className='w-8 h-8 rounded-full object-cover border-2 border-indigo-500/25 flex items-center justify-center'>
                                    <FaUser size={16} className='text-slate-400 my-1' />
                                </div>
                        }
                    </div>


                </div>
            </>
        )
    }
    return (
        <aside className='glass-panel sidebar-glass fixed lg:static inset-y-0 left-0 z-50 w-[270px] h-screen shrink-0 border-r border-white/70'>
            <div className='flex flex-col h-full'>
                <div className='flex items-center gap-2.5 px-4 py-4 border-b border-white/10'>
                    <button type='button' className='icon-control hidden lg:flex w-7 h-7 rounded-lg'
                        onClick={() => setCollapsed(true)}
                    >
                        <LuPanelLeft />
                    </button>
                    <div className='premium-mark shrink-0'><LuSparkles size={15} /></div>
                    <div className='min-w-0 flex-1 leading-none'>
                        <span className='block text-[14px] font-bold text-slate-800 tracking-tight'>ALPHA AI</span>
                        <span className='block mt-1 text-[9px] font-semibold text-sky-500 uppercase tracking-[0.14em]'>Creative studio</span>
                    </div>
                    <span className='premium-label text-[9px] font-bold px-2 py-1 rounded-full tracking-wide uppercase'>Beta</span>
                    <button type='button' className='icon-control w-7 h-7 rounded-lg'
                        onClick={() => dispatch(setSelectedConversation(null))}>
                        <HiOutlinePencilAlt size={14} />
                    </button>
                </div>

                <div className='px-4 pt-4 pb-1'>
                    <button className='blue-action w-full flex items-center justify-center gap-2 text-sm font-semibold rounded-xl py-[11px] border-none cursor-pointer transition-all duration-150'
                        onClick={() => dispatch(setSelectedConversation(null))}
                    >
                        <HiPlus />
                        New Chat
                    </button>
                </div>

                {conversations.length == 0 ? (
                    <>
                        <div className='px-5 pt-4 pb-1.5 text-[10.5px] font-semibold uppercase tracking-widest text-slate-600'>
                            No Recent Conversations
                        </div>
                    </>
                ) : (
                    <>
                        <div className='px-5 pt-4 pb-1.5 text-[10.5px] font-semibold uppercase tracking-widest text-slate-600'>
                            Recent
                        </div>
                    </>
                )}

                <div className='flex-1 overflow-y-auto px-2.5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden '>
                    {conversations.map((conv, idx) => {
                        const isActive = selectedConversation?._id == conv?._id;
                        return (
                            <div
                                key={conv?._id || idx}
                                onClick={() => dispatch(setSelectedConversation(conv))}
                                className={`flex items-center gap-2.5 cursor-pointer mb-0.5 px-3 py-2.5 rounded-[10px] border transition-colors duration-150 ${isActive ? "bg-indigo-500/10 border-indigo-500/[0.18]" : "bg-transparent border-transparent"}`}>

                                <div className={`flex items-center justify-center shrink-0 w-[28px] h-[28px] rounded-lg transition-colors duration-150 ${isActive ? "bg-indigo-500/15 text-indigo-400" : "bg-white/[0.05] text-slate-500"}`}>
                                    <LuMessageSquare />
                                </div>
                                <span className={`text-[13px] font-medium truncate ${isActive ? "text-slate-100" : "text-slate-300"}`}>
                                    {conv?.title || "New Chat"}
                                </span>
                            </div>
                        )
                    })}
                </div>

                <div className='mx-2.5 h-px bg-white/[0.06]' />

                <div className='px-3.5 py.3.5'>
                    {userData && (
                        <>
                            <div className='flex items-center justify-center gap-2.5 cursor-pointer rounded-xl px-3 py-2.5 my-2 hover:bg-white/[0.05] transition-colors duration-150'>
                                <div className='relative shrink-0'>
                                    {
                                        (userData?.avatar && !imageError) ?
                                            <img className='w-9 h-9 rounded-[10px] object-cover border-2 border-indigo-500/25' src={userData?.avatar} alt={"image"} onError={() => setImageError(true)} />
                                            :
                                            <div className='w-9 h-9 rounded-full object-cover border-2 border-indigo-500/25 flex items-center justify-center'>
                                                <FaUser size={20} className='text-slate-400 my-1' />
                                            </div>
                                    }
                                </div>

                                <div className='flex-1 min-w-0'>
                                    <p className='text-[13.5px] font-semibold text-slate-100 truncate'>{userData?.user?.name || "user"}</p>
                                    <p className='text-[11px] text-slate-600 mt-px'>{"Free Plan"}</p>
                                </div>
                                <div className='flex gap-1'>
                                    <button className='flex items-center justify-center w-7 h-7 rounded-[7px] border-none bg-transparent text-yellow-600 cursor-pointer hover:bg-white/[0.08] hover:text-slate-400 transition-all duration-150'>
                                        <LuCoins size={16} />
                                    </button>
                                    <button className='flex items-center justify-center w-7 h-7 rounded-[7px] border-none bg-transparent text-slate-600 cursor-pointer hover:bg-white/[0.08] hover:text-slate-400 transition-all duration-150'
                                        onClick={handleLogout}
                                    >
                                        <LuLogOut size={16} />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </aside>
    )
}

export default SideBar
