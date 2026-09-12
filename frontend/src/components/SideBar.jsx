import { useEffect, useState } from 'react'
import { LuCoins, LuLogOut, LuMenu, LuMessageSquare, LuPanelLeft, LuPanelRight, LuPlus, LuSparkles, LuX } from "react-icons/lu";
import { HiOutlinePencilAlt, HiPlus } from "react-icons/hi";
import { FaUser } from "react-icons/fa";
import { useDispatch, useSelector } from 'react-redux';
import { setConversations, setSelectedConversation } from '../redux/conversationSlice';
import { getConversations } from '../features/getConversations';
import { logOut } from '../features/logOut';
import { setUserData } from '../redux/userSlice';
import { easeInOut, motion } from 'motion/react';
import BillingDrawer from './BillingDrawer';
import { openAuth } from '../redux/uiSlice';
import { signOut } from 'firebase/auth';
import { auth } from '../utils/firebase';



function SideBar() {
    const [collapsed, setCollapsed] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [showBilling, setShowBilling] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const { conversations, selectedConversation } = useSelector(state => state.conversation);
    const { userData } = useSelector(state => state.user);
    const dispatch = useDispatch();
    const avatar = userData?.avatar || userData?.user?.avatar;
    const userName = userData?.name || userData?.user?.name || "user";
    const userEmail = userData?.email || userData?.user?.email || "";

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
        } catch (error) {
            console.error("logout error", error);
        } finally {
            try {
                await signOut(auth);
            } catch (error) {
                console.error("firebase logout error", error);
            }
            dispatch(setUserData(null));
            dispatch(setSelectedConversation(null));
        }
    };

    if (collapsed) {
        return (
            <>
                <motion.div
                    layout
                    initial={{ opacity: 0, x: 12, width: 56 }}
                    animate={{ opacity: 1, x: 0, width: 56 }}
                    transition={{ duration: 0.25, ease: easeInOut, layout: { duration: 0.25, ease: easeInOut } }}
                    className='glass-panel sidebar-glass hidden lg:flex flex-col items-center w-[56px] h-screen border-r border-white/70 py-4 gap-1 shrink-0'
                >
                    <button className='flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors duration-150 bg-transparent border-none cursor-pointer mb-1 '
                        onClick={() => setCollapsed(false)}
                    >
                        <LuPanelRight />
                    </button>
                    <button className='flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors duration-150 bg-transparent border-none cursor-pointer mb-1 '
                        onClick={() => dispatch(setSelectedConversation(null))}>
                        <LuPlus size={18} />
                    </button>

                    <div className='flex-1 overflow-y-auto px-2.5 pb-2 scrollbar-none pt-5'>
                        {conversations.map((conv, idx) => {
                            let isActive = selectedConversation?._id == conv?._id;
                            return (
                                <motion.div
                                    key={conv?._id || idx}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.18, delay: Math.min(idx * 0.03, 0.18) }}
                                    onClick={() => dispatch(setSelectedConversation(conv))}
                                    className={`flex items-center gap-1 cursor-pointer mb-0.5 px-2 py-2 rounded-[10px] border transition-colors duration-150 ${isActive ? "bg-indigo-500/10 border-indigo-500/18" : "bg-transparent border-transparent"}`}>

                                    <div className={`flex items-center justify-center shrink-0 w-[28px] h-[28px] rounded-lg transition-colors duration-150 ${isActive ? "bg-indigo-500/15 text-indigo-400" : "bg-white/5 text-slate-500"}`}>
                                        <LuMessageSquare />
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>

                    <div className='relative shrink-0'>
                        {
                            (avatar && !imageError) ?
                                <img className='w-8 h-8 rounded-[10px] object-cover border-2 border-indigo-500/25' src={avatar} alt={"user avatar"} onError={() => setImageError(true)} />
                                :
                                <div className='w-8 h-8 rounded-full object-cover border-2 border-indigo-500/25 flex items-center justify-center'>
                                    <FaUser size={12} className='text-slate-400 my-1' />
                                </div>
                        }
                    </div>


                </motion.div>
            </>
        )
    }
    return (
        <>
            <button className='lg:hidden fixed top-3.5 left-4 z-50 flex items-center justify-center w-8 h-8 rounded-lg bg-[#0d0f14] border border-white/6 text-slate-400 hover:text-slate-200 transition-colors duration-150 cursor-pointer'
                onClick={() => setMobileOpen(true)}>
                <LuMenu size={14} />
            </button>

            {
                mobileOpen && <div onClick={() => setMobileOpen(false)} className='lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm' />
            }

            <motion.aside
                layout
                initial={{ opacity: 0, x: -18, width: 270 }}
                animate={{ opacity: 1, x: 0, width: 270 }}
                transition={{ duration: 0.25, ease: "easeInOut", layout: { duration: 0.25, ease: "easeInOut" } }}
                className={`glass-panel sidebar-glass fixed lg:static inset-y-0 left-0 z-50 w-90 h-screen shrink-0 border-r border-white/70 transition-transform duration-250 ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
            >

                <div className='flex flex-col h-full'>
                    <div className='flex items-center gap-2.5 px-4 py-4 border-b border-white/10'>
                        <button type='button' className='icon-control hidden lg:flex w-7 h-7 rounded-lg'
                            onClick={() => setCollapsed(true)}
                        >
                            <LuPanelLeft />
                        </button>

                        <button className='lg:hidden flex items-center justify-center w-7 h-7  rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors duration-150 bg-transparent border-none cursor-pointer' onClick={() => setMobileOpen(false)}>
                            <LuX />
                        </button>

                        <div className='premium-mark shrink-0'><LuSparkles size={15} /></div>
                        <div className='min-w-0 flex-1 leading-none'>
                            <span className='block text-[14px] font-bold text-slate-800 tracking-tight'>ALPHA AI</span>
                            <span className='block mt-1 text-[9px] font-semibold text-sky-500 uppercase tracking-[0.14em]'>Creative studio</span>
                        </div>
                        <span className='premium-label text-[9px] font-bold px-2 py-1 rounded-full tracking-wide uppercase'>{userData?.plan || "free"}</span>
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

                    <div className='flex-1 overflow-y-auto px-2.5 pb-2 scrollbar-none '>
                        {conversations.map((conv, idx) => {
                            const isActive = selectedConversation?._id == conv?._id;
                            return (
                                <motion.div
                                    key={conv?._id || idx}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.18, delay: Math.min(idx * 0.03, 0.18) }}
                                    onClick={() => dispatch(setSelectedConversation(conv))}
                                    className={`flex items-center gap-2.5 cursor-pointer mb-0.5 px-3 py-2.5 rounded-[10px] border transition-colors duration-150 ${isActive ? "bg-indigo-500/10 border-indigo-500/18" : "bg-transparent border-transparent"}`}>

                                    <div className={`flex items-center justify-center shrink-0 w-[28px] h-[28px] rounded-lg transition-colors duration-150 ${isActive ? "bg-indigo-500/15 text-indigo-400" : "bg-white/5 text-slate-500"}`}>
                                        <LuMessageSquare />
                                    </div>
                                    <span className={`text-[13px] font-medium truncate ${isActive ? "text-slate-100" : "text-slate-300"}`}>
                                        {conv?.title || "New Chat"}
                                    </span>
                                </motion.div>
                            )
                        })}
                    </div>

                    <div className='mx-2.5 h-px bg-white/6' />

                    <div className='px-3.5 py.3.5'>
                        {userData && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.22, delay: 0.12 }}
                                    className='flex items-center justify-center gap-2.5 cursor-pointer rounded-xl px-3 py-2.5 my-2 hover:bg-white/5 transition-colors duration-150'
                                >
                                    <div className='relative shrink-0'>
                                        {
                                            (avatar && !imageError) ?
                                                <img className='w-9 h-9 rounded-[10px] object-cover border-2 border-indigo-500/25' src={avatar} alt={"user avatar"} onError={() => setImageError(true)} />
                                                :
                                                <div className='w-10 h-10 rounded-full object-cover border-2 border-indigo-500/25 flex items-center justify-center'>
                                                    <FaUser size={16} className='text-slate-400 my-1' />
                                                </div>
                                        }
                                    </div>

                                    <div className='flex-1 min-w-0'>
                                        <p className='text-[13.5px] font-semibold text-slate-100 truncate'>{userName}</p >
                                        <p className='text-[11px] text-slate-500 mt-px truncate'>{userEmail}</p>
                                    </div>
                                    <div className='flex gap-1'>
                                        <button
                                            onClick={() => setShowBilling(true)}
                                            className='flex items-center justify-center w-7 h-7 rounded-[7px] border-none bg-transparent text-yellow-600 cursor-pointer hover:bg-white/8 hover:text-slate-400 transition-all duration-150'>
                                            <LuCoins size={16} />
                                        </button>
                                        <button className='flex items-center justify-center w-7 h-7 rounded-[7px] border-none bg-transparent text-slate-600 cursor-pointer hover:bg-white/8 hover:text-slate-400 transition-all duration-150'
                                            onClick={handleLogout}
                                        >
                                            <LuLogOut size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            </>
                        )}
                        {!userData && (
                            <motion.button
                                type='button'
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.22 }}
                                onClick={() => dispatch(openAuth("signup"))}
                                className='blue-action mb-2 flex w-full items-center justify-center gap-2 rounded-xl border-none py-3.5 text-xs font-semibold transition-all'
                            >
                                <LuSparkles size={14} />
                                Create account
                            </motion.button>
                        )}
                    </div>
                </div>

            </motion.aside>
            <BillingDrawer
                open={showBilling}
                onClose={() => setShowBilling(false)}
            />
        </>
    )
}

export default SideBar
