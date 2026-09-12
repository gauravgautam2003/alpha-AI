import { useEffect, useRef, useState } from 'react'
import { LuCode, LuFileText, LuGlobe, LuImage, LuMessageSquare, LuMic, LuMicOff, LuPaperclip, LuPresentation, LuSend, LuX, LuZap } from "react-icons/lu";
import { useDispatch, useSelector } from "react-redux"
import { sendMessage } from '../features/sendMessage';
import { addMessage, setArtifacts, setIsLoading } from '../redux/messageSlice';
import { createConversation } from '../features/createConversation';
import { addConversation, setConversationTitle, setSelectedConversation } from '../redux/conversationSlice';
import { updateConversation } from '../features/updateConversation';
import { motion } from 'motion/react';
import { openAuth, setValue } from '../redux/uiSlice';

function ChatInput() {
    const { userData } = useSelector(state => state.user);
    const { selectedConversation } = useSelector(state => state.conversation);
    const { value } = useSelector(state => state.ui);
    const [selectedAgent, setSelectedAgent] = useState("Auto");
    const { isLoading } = useSelector(state => state.message)
    const [isSending, setIsSending] = useState(false);
    const [requestError, setRequestError] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [listening, setListening] = useState(false)
    const [volume, setVolume] = useState(0)
    const recognitionRef = useRef(null)
    const transcriptRef = useRef("")
    const audioStreamRef = useRef(null)
    const audioContextRef = useRef(null)
    const analyserRef = useRef(null)
    const animationFrameRef = useRef(null)
    const fileRef = useRef(null)
    const dispatch = useDispatch();

    const stopVolumeMonitor = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
            animationFrameRef.current = null
        }
        analyserRef.current = null
        audioContextRef.current?.close()
        audioContextRef.current = null
        audioStreamRef.current?.getTracks().forEach((track) => track.stop())
        audioStreamRef.current = null
        setVolume(0)
    }

    const startVolumeMonitor = async (stream) => {
        audioStreamRef.current = stream
        const AudioContext = window.AudioContext || window.webkitAudioContext
        if (!AudioContext) return

        const audioContext = new AudioContext()
        const analyser = audioContext.createAnalyser()
        const source = audioContext.createMediaStreamSource(stream)
        analyser.fftSize = 256
        source.connect(analyser)
        audioContextRef.current = audioContext
        analyserRef.current = analyser

        const data = new Uint8Array(analyser.fftSize)
        const updateVolume = () => {
            analyser.getByteTimeDomainData(data)
            const amplitude = data.reduce((total, sample) => {
                const normalizedSample = (sample - 128) / 128
                return total + normalizedSample * normalizedSample
            }, 0) / data.length
            setVolume(Math.min(1, Math.sqrt(amplitude) * 3))
            animationFrameRef.current = requestAnimationFrame(updateVolume)
        }

        await audioContext.resume()
        updateVolume()
    }

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.lang = window.navigator.language || "en-US";
        recognition.interimResults = true;
        recognition.continuous = true;

        recognition.onresult = (event) => {
            let interimTranscript = "";

            for (let index = event.resultIndex; index < event.results.length; index++) {
                const result = event.results[index];
                if (result.isFinal) {
                    transcriptRef.current += result[0].transcript;
                } else {
                    interimTranscript += result[0].transcript;
                }

            }

            dispatch(setValue(`${transcriptRef.current} ${interimTranscript}`.trim()))
        }
        recognition.onstart = () => {
            setListening(true)
            setRequestError("")
        }
        recognition.onerror = (event) => {
            setListening(false)
            stopVolumeMonitor()
            setRequestError(`Speech recognition error: ${event.error}.`)
        }
        recognition.onend = () => {
            setListening(false)
            stopVolumeMonitor()
        }
        recognitionRef.current = recognition

        return () => {
            recognition.abort();
            stopVolumeMonitor();
            recognitionRef.current = null;
        }
    }, [dispatch])

    const toggleMic = async () => {
        if (!recognitionRef.current) {
            alert("speech recognition not supported")
            return
        }

        if (listening) {
            recognitionRef.current.stop();
            stopVolumeMonitor()
            setListening(false)
        } else {
            try {
                if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
                    throw new Error("Microphone requires localhost or HTTPS.")
                }

                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                await startVolumeMonitor(stream);
                transcriptRef.current = value.trim();
                recognitionRef.current.start();
            } catch (error) {
                stopVolumeMonitor()
                setListening(false)
                const message = error.name === "NotAllowedError"
                    ? "Microphone permission is blocked. Allow microphone access in browser site settings."
                    : error.name === "NotFoundError"
                        ? "No microphone was found. Connect a microphone and try again."
                        : error.name === "NotReadableError" || error.message === "audio-capture"
                            ? "Microphone is unavailable or being used by another app."
                            : error.message || "Could not access the microphone."
                setRequestError(message)
                console.error("speech recognition start error", error)
            }
        }
    }
    const handleSendMessage = async () => {
        const messageValue = value.trim();
        if (!messageValue || isSending) return;

        if (!userData) {
            dispatch(openAuth("signup"));
            return;
        }

        setIsSending(true);
        dispatch(setIsLoading(true));
        setRequestError("");

        try {
            let conversation = selectedConversation;

            if (!conversation) {
                const conv = await createConversation();
                if (!conv?._id) {
                    throw new Error("Conversation could not be created");
                }

                dispatch(setSelectedConversation(conv));
                dispatch(addConversation(conv));
                conversation = conv;
            }

            if (conversation.title == "New Chat") {
                await updateConversation({ id: conversation._id, title: messageValue });
                dispatch(setConversationTitle({ conversationId: conversation._id, title: messageValue.slice(0, 40) }));
            }

            dispatch(addMessage({ role: "user", content: value }));
            dispatch(setValue(""));


            const formData = new FormData()
            formData.append("prompt", messageValue)
            formData.append("conversationId", conversation._id)
            formData.append("agent", selectedAgent.toLowerCase())
            if (selectedFile) {
                formData.append("file", selectedFile)
            }

            const data = await sendMessage(formData);


            const responseText = typeof data === 'string'
                ? data
                : (data?.aiResponse || data?.answer || data?.content || data?.text || data?.message || JSON.stringify(data));

            setSelectedFile(null)
            dispatch(setArtifacts(data?.artifacts || []));
            dispatch(addMessage({
                role: "assistant",
                content: responseText,
                images: data?.images || [],
                artifacts: data?.artifacts || []
            }));
        } catch (error) {
            console.error("send message error", error);
            setRequestError("Message could not be sent. Please try again.");
        } finally {
            dispatch(setIsLoading(false));
            setIsSending(false);
        }
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
        },
        {
            id: "resume",
            icon: LuFileText,
            label: "Resume"
        }
    ]
    return (
        <div className='w-full overflow-hidden px-3 md:px-6 pb-5 pt-2 shrink-0'>
            <div className='mirror-surface max-w-5xl mx-auto flex flex-col gap-3 rounded-3xl px-4 pt-3.5 pb-3'>
                <div className='flex gap-2 flex-wrap pr-3'>
                    {agents.map((agent) => {
                        const isActive = selectedAgent === agent.label
                        const Icon = agent.icon

                        return (
                            <button key={agent.id} type='button' onClick={() => setSelectedAgent(agent.label)} className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-semibold border transition-all cursor-pointer
                            ${isActive ? "blue-action border-transparent" : "glass-button text-slate-500"}`}>
                                <Icon size={14} className={`${isActive ? 'text-white' : 'text-sky-600'}`} />
                                <span className={` ${isActive ? 'text-white' : 'text-slate-600'}`}>
                                    {agent.label}
                                </span>
                            </button>
                        )
                    })}
                </div>

                {
                    selectedFile && (
                        <div className="my-3">
                            <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                                {
                                    selectedFile.type === "application/pdf" ? <LuFileText className='text-red-400' size={14} /> : selectedFile.type.startsWith("image/") && <img src={URL.createObjectURL(selectedFile)} alt="image" className='h-10 w-10 rounded-xl object-cover mt-3' />
                                }
                                <div>
                                    <p className='text-xs text-whte'>{selectedFile?.name}</p>
                                    <p className='text-[10px] text-slate-500'>{Math.ceil(selectedFile.size)} KB</p>
                                </div>

                                <button className='mt-2' onClick={() => {
                                    setSelectedFile(null); fileRef.current.value = ""
                                }}><LuX size={14} className='text-slate-500 hover:text-white' /></button>
                            </div>
                        </div>
                    )
                }

                <textarea
                    placeholder='Ask Anything...'
                    onChange={(e) => dispatch(setValue(e.target.value))}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            handleSendMessage();
                        }
                    }}
                    value={value}
                    rows={2}
                    className='w-full mt-6 bg-transparent outline-none resize-none text-[15px] text-slate-700 placeholder:text-slate-400 leading-7 [scroll-width:none] [&::-webkit-scrollbar]:hidden disabled:opacity-50 ' />

                {requestError && <p role='alert' className='text-xs text-red-400'>{requestError}</p>}

                <div className='flex items-center justify-between gap-3'>
                    <div className='flex items-center gap-1'>

                        <input type="file" accept='pdf, image/*' hidden ref={fileRef} onChange={(e) => {
                            const file = e.target.files[0]
                            if (file) {
                                setSelectedFile(file)
                            }
                        }} />

                        <button type='button' className='icon-control w-8 h-8 rounded-lg text-slate-500' onClick={() => fileRef.current.click()}>
                            <LuPaperclip size={16} />
                        </button>
                        <button
                            onClick={toggleMic}
                            type='button'
                            aria-label={listening ? "Stop speech recognition" : "Start speech recognition"}
                            aria-pressed={listening}
                            title={listening ? "Stop listening" : "Start voice input"}
                            className={`relative icon-control w-8 h-8 rounded-lg ${listening ? "bg-red-500 text-white" : "text-slate-600 hover:bg-white/[0.05]"}`}
                        >
                            {listening && <motion.span
                                aria-hidden='true'
                                animate={{ scale: [1, 1.45, 1], opacity: [0.55, 0, 0.55] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                                className='absolute inset-0 rounded-lg bg-red-400'
                            />}
                            <span className='relative z-10'>{listening ? <LuMic size={16} /> : <LuMicOff size={16} />}</span>
                        </button>
                        {listening && <div className='flex h-4 items-end gap-0.5 pl-0.5' aria-hidden='true'>
                            {[0.65, 1, 0.8, 0.55].map((barScale, barIndex) => (
                                <motion.span
                                    key={barIndex}
                                    style={{ height: `${Math.max(3, 4 + volume * barScale * 14)}px` }}
                                    className='w-0.5 origin-bottom rounded-full bg-red-400 transition-[height] duration-75'
                                />
                            ))}
                        </div>}
                    </div>

                    <div className='hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-slate-400'>
                        <span className='w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(74,222,128,.16)]' />
                        Alpha model online
                    </div>

                    <motion.button type='button' whileTap={{ scale: 0.92 }} whileHover={{ scale: value.trim() ? 1.04 : 1 }} disabled={isSending || !value.trim() || isLoading}
                        onClick={handleSendMessage}
                        className={`flex items-center justify-center w-9 h-9 cursor-pointer rounded-xl border-none transition-all duration-150 ${value.trim() ? "blue-action" : "text-slate-400 bg-white/10 border border-sky-100 cursor-not-allowed"}`}>
                        <LuSend size={15} />
                    </motion.button>
                </div>
            </div>
        </div>
    )
}

export default ChatInput
