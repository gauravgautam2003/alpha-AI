import React, { useEffect, useState } from 'react'
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../utils/firebase"
import api from '../utils/axios';

import { FcGoogle } from "react-icons/fc";
import { useDispatch, useSelector } from 'react-redux';
import { setUserData } from '../redux/userSlice';
import SideBar from '../components/SideBar';
import ChatArea from '../components/ChatArea';
import Artifact from '../components/Artifact';


const Home = () => {
    const { userData } = useSelector(state => state.user);
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
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
    }, [dispatch]);

    const handleLogin = async (token) => {
        try {
            const { data } = await api.post("/api/auth/login", { token });
            dispatch(setUserData(data));
        } catch (error) {
            console.log("login error", error);
        }

    }
    const googleLogin = async () => {
        try {
            const data = await signInWithPopup(auth, googleProvider);
            let token = await data.user.getIdToken();
            await handleLogin(token);
        } catch (error) {
            console.log("google login error", error);
        }
    }

    return (
        <div className='h-screen flex text-white overflow-hidden bg-[#0d0f14]'>

            <SideBar />
            <ChatArea />
            <Artifact />

            {!loading && !userData &&
                <div className='fixed flex items-center justify-center bg-black/60 inset-0 z-50 backdrop-blur'>
                    <div className='w-[350px] bg-[#13151c] border border-white/[0.08] rounded-2xl p-7 flex flex-col gap-5 '>
                        <div className='flex flex-col gap-1'>
                            <h2 className='text-[17px] font-semibold text-slate-100 tracking-tight '>Welcome to Alpha AI</h2>
                            <p className='text-[13px] text-slate-500 '>Please login to continue using the app</p>
                        </div>

                        <button className='w-full flex items-center justify-center gap-3 py-[11px] rounded-xl text-sm font-medium text-white bg-linear-to-br from-indigo-800 to-violet-700 hover:from-indigo-400 hover:to-violet-600 active:from-indigo-600 active:to-violet-800 border border-indigo-500/30 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-150 cursor-pointer ' onClick={googleLogin}>
                            <FcGoogle size={20} />
                            Continue with Google
                        </button>
                    </div>
                </div>
            }
        </div>
    )
}

export default Home