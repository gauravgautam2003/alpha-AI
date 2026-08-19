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
        <div className='app-shell h-screen flex text-slate-700 overflow-hidden'>

            <SideBar />
            <ChatArea />
            <Artifact />

            {!loading && !userData &&
                <div className='fixed flex items-center justify-center bg-sky-950/20 inset-0 z-50 backdrop-blur-md p-4'>
                    <div className='glass-panel w-full max-w-[350px] rounded-2xl p-7 flex flex-col gap-5 '>
                        <div className='flex flex-col gap-1'>
                            <h2 className='text-[17px] font-semibold text-slate-800 tracking-tight '>Welcome to Alpha AI</h2>
                            <p className='text-[13px] text-slate-500 '>Please sign in to continue using the app.</p>
                        </div>

                        <button className='blue-action w-full flex items-center justify-center gap-3 py-[11px] rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ' onClick={googleLogin}>
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
