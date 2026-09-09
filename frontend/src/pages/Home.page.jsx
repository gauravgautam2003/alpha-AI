import { useCallback, useEffect, useState } from 'react'
import { isSignInWithEmailLink, sendSignInLinkToEmail, signInWithEmailLink, signInWithPopup, updateProfile } from "firebase/auth";
import { auth, googleProvider } from "../utils/firebase"
import api from '../utils/axios';

import { FcGoogle } from "react-icons/fc";
import { LuArrowRight, LuLockKeyhole, LuMail, LuSparkles, LuUserRound, LuX } from "react-icons/lu";
import { AnimatePresence, motion } from "motion/react";
import { useDispatch, useSelector } from 'react-redux';
import { setUserData } from '../redux/userSlice';
import SideBar from '../components/SideBar';
import ChatArea from '../components/ChatArea';
import Artifact from '../components/Artifact';
import AppSkeleton from '../skeletons/AppSkeleton';


const Home = () => {
    const { userData } = useSelector(state => state.user);
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(true);
    const [loginError, setLoginError] = useState("");
    const [authMode, setAuthMode] = useState("login");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [verificationSent, setVerificationSent] = useState(false);
    const [verificationEmail, setVerificationEmail] = useState("");
    const [showAuth, setShowAuth] = useState(false);

    const handleLogin = useCallback(async (token) => {
        try {
            const { data } = await api.post("/api/auth/login", { token });
            dispatch(setUserData(data));
        } catch (error) {
            console.log("login error", error);
        }
    }, [dispatch]);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                if (isSignInWithEmailLink(auth, window.location.href)) {
                    setShowAuth(true);
                    const email = localStorage.getItem("alpha-ai-pending-email");
                    if (!email) {
                        throw new Error("Email is required to complete sign in");
                    }

                    const { user } = await signInWithEmailLink(auth, email, window.location.href);
                    const name = localStorage.getItem("alpha-ai-pending-name");
                    if (name) {
                        await updateProfile(user, { displayName: name });
                    }
                    localStorage.removeItem("alpha-ai-pending-email");
                    localStorage.removeItem("alpha-ai-pending-name");
                    window.history.replaceState({}, document.title, window.location.pathname);
                    await handleLogin(await user.getIdToken(true));
                    return;
                }

                const { data } = await api.get("/api/me");
                if (data && (data._id || data.user)) {
                    dispatch(setUserData(data));
                }
            } catch (error) {
                console.log("No active session", error);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, [dispatch, handleLogin]);

    const googleLogin = async () => {
        try {
            const { data } = await signInWithPopup(auth, googleProvider);
            let token = await data.user.getIdToken();
            await handleLogin(token);
        } catch (error) {
            console.log("google login error", error);
        }
    }

    const emailAuth = async (event) => {
        event.preventDefault();
        setLoginError("");

        const formData = new FormData(event.currentTarget);
        const name = formData.get("name")?.trim();
        const email = formData.get("email");

        setIsSubmitting(true);
        try {
            localStorage.setItem("alpha-ai-pending-email", email);
            if (authMode === "signup") {
                localStorage.setItem("alpha-ai-pending-name", name);
            } else {
                localStorage.removeItem("alpha-ai-pending-name");
            }

            await sendSignInLinkToEmail(auth, email, {
                url: window.location.origin,
                handleCodeInApp: true
            });
            setVerificationEmail(email);
            setVerificationSent(true);
        } catch (error) {
            setLoginError(error.code === "auth/invalid-action-code"
                ? "This email link is no longer valid. Please request a new one."
                : "Could not send the email. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    const resendVerificationEmail = async () => {
        setLoginError("");
        try {
            await sendSignInLinkToEmail(auth, verificationEmail, {
                url: window.location.origin,
                handleCodeInApp: true
            });
        } catch {
            setLoginError("Please wait a moment before requesting another email.");
        }
    }

    if (loading) {
        return <AppSkeleton />;
    }

    return (
        <div className='app-shell h-screen flex text-slate-700 overflow-hidden'>

            <SideBar onRequireAuth={(mode = "login") => { setAuthMode(mode); setShowAuth(true); }} />
            <ChatArea onRequireAuth={() => { setAuthMode("signup"); setShowAuth(true); }} />
            <Artifact />

            {!userData && showAuth &&
                <motion.div className='fixed inset-0 z-50 flex items-center justify-center bg-[#020817]/70 p-4 backdrop-blur-xl' initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
                    <motion.div layout className='w-full max-w-[820px] overflow-hidden rounded-[28px]' initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 24, layout: { type: "spring", stiffness: 320, damping: 30 } }}>
                        <div className='glass-panel grid overflow-hidden rounded-[28px] border-white/15 shadow-2xl shadow-sky-950/40 md:grid-cols-[0.9fr_1.1fr]'>
                            <div className='relative hidden flex-col justify-between overflow-hidden border-r border-white/10 bg-sky-950/45 p-9 md:flex'>
                                <motion.div className='relative z-10' initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18, duration: 0.45 }}>
                                    <div className='mb-10 flex items-center gap-3'>
                                        <span className='premium-mark'><LuSparkles size={16} /></span>
                                        <span className='text-sm font-bold tracking-[0.18em] text-white'>ALPHA AI</span>
                                    </div>
                                    <p className='premium-label mb-4 inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]'>Your intelligent workspace</p>
                                    <h2 className='max-w-[260px] text-3xl font-semibold leading-tight tracking-tight text-white'>Make ideas move at the speed of thought.</h2>
                                    <p className='mt-5 max-w-[270px] text-sm leading-6 text-sky-100/65'>One calm space for conversations, research, code, documents and everything in between.</p>
                                </motion.div>
                                <motion.div className='relative z-10 flex items-center gap-2 text-xs text-sky-100/60' initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45, duration: 0.4 }}>
                                    <LuLockKeyhole size={14} className='text-cyan-300' />
                                    Private by design. Ready when you are.
                                </motion.div>
                                <div className='absolute -right-16 top-28 h-48 w-48 rounded-full border border-cyan-300/20 bg-cyan-300/10 blur-2xl' />
                                <div className='absolute -bottom-20 -left-16 h-48 w-48 rounded-full border border-indigo-300/20 bg-indigo-400/10 blur-2xl' />
                            </div>

                            <motion.div className='p-6 sm:p-9' initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12, duration: 0.45 }}>
                                <div className='mb-7 flex items-start justify-between gap-4'>
                                    <div>
                                        <p className='mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300'>Welcome back</p>
                                        <h1 className='text-2xl font-semibold tracking-tight text-white'>{authMode === "login" ? "Sign in to Alpha AI" : "Please create your account"}</h1>
                                        <p className='mt-2 text-sm text-slate-400'>{authMode === "login" ? "Continue where your best work left off." : "Create an account to send messages and continue your conversation."}</p>
                                    </div>
                                    <div className='flex items-center gap-3'>
                                        <LuSparkles size={20} className='mt-1 shrink-0 text-cyan-300' />
                                        <button type='button' aria-label='Close authentication form' title='Back to chat' onClick={() => setShowAuth(false)} className='icon-control h-8 w-8 rounded-lg text-slate-400 hover:text-white'>
                                            <LuX size={16} />
                                        </button>
                                    </div>
                                </div>

                                {verificationSent && <motion.div className='flex flex-col items-center py-8 text-center' initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                                    <div className='mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-300'>
                                        <LuMail size={28} />
                                    </div>
                                    <h2 className='text-xl font-semibold text-white'>Verify your email</h2>
                                    <p className='mt-3 max-w-[320px] text-sm leading-6 text-slate-400'>We sent a verification link to <span className='font-semibold text-cyan-200'>{verificationEmail}</span>. Verify it, then return here to enter your workspace.</p>
                                    {loginError && <p role='alert' className='mt-4 rounded-lg border border-red-300/20 bg-red-400/10 px-3 py-2 text-xs text-red-200'>{loginError}</p>}
                                    <button type='button' onClick={resendVerificationEmail} className='blue-action mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold'>Send link again <LuArrowRight size={16} /></button>
                                    <button type='button' onClick={resendVerificationEmail} className='mt-4 text-xs font-semibold text-cyan-300 transition-colors hover:text-cyan-200'>Resend verification email</button>
                                </motion.div>}

                                {!verificationSent && <>
                                    <div className='mb-6 grid grid-cols-2 rounded-xl border border-white/10 bg-white/[0.04] p-1'>
                                        {[["login", "Sign in"], ["signup", "Create account"]].map(([mode, label]) => (
                                            <button key={mode} type='button' onClick={() => { setAuthMode(mode); setLoginError(""); }} className={`rounded-lg px-3 py-2.5 text-xs font-semibold transition-all ${authMode === mode ? "bg-white/10 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"}`}>
                                                {label}
                                            </button>
                                        ))}
                                    </div>

                                    <button type='button' className='glass-button flex w-full items-center justify-center gap-3 rounded-xl py-3 text-sm font-semibold transition-all' onClick={googleLogin}>
                                        <FcGoogle size={19} />
                                        Continue with Google
                                    </button>

                                    <div className='my-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500'>
                                        <span className='h-px flex-1 bg-white/10' />
                                        or use email
                                        <span className='h-px flex-1 bg-white/10' />
                                    </div>

                                    <AnimatePresence mode='wait' initial={false}>
                                        <motion.form key={authMode} className='flex flex-col gap-4' onSubmit={emailAuth} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                                            {authMode === "signup" && <div>
                                                <label htmlFor='name' className='mb-1.5 block text-xs font-semibold text-slate-300'>Full name</label>
                                                <div className='relative'>
                                                    <LuUserRound size={16} className='absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500' />
                                                    <input id='name' name='name' placeholder='Your full name' className='w-full rounded-xl border border-white/10 bg-white/[0.06] py-3 pl-10 pr-3 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-cyan-300/60 focus:bg-white/[0.08] focus:ring-4 focus:ring-cyan-300/10' type='text' autoComplete='name' required />
                                                </div>
                                            </div>}
                                            <div>
                                                <label htmlFor='email' className='mb-1.5 block text-xs font-semibold text-slate-300'>Email address</label>
                                                <div className='relative'>
                                                    <LuMail size={16} className='absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500' />
                                                    <input id='email' name='email' placeholder='you@example.com' className='w-full rounded-xl border border-white/10 bg-white/[0.06] py-3 pl-10 pr-3 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-cyan-300/60 focus:bg-white/[0.08] focus:ring-4 focus:ring-cyan-300/10' type='email' autoComplete='email' required />
                                                </div>
                                            </div>
                                            {loginError && <p role='alert' className='rounded-lg border border-red-300/20 bg-red-400/10 px-3 py-2 text-xs text-red-200'>{loginError}</p>}

                                            <button type='submit' disabled={isSubmitting} className='blue-action mt-1 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60'>
                                                {isSubmitting ? "Sending link..." : authMode === "login" ? "Email me a sign-in link" : "Create with email link"}
                                                {!isSubmitting && <LuArrowRight size={16} />}
                                            </button>
                                        </motion.form>
                                    </AnimatePresence>
                                </>}
                                <p className='mt-6 text-center text-[11px] leading-5 text-slate-500'>By continuing, you agree to Alpha AI's terms and acknowledge its privacy policy.</p>
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>
            }
        </div>
    )
}

export default Home
