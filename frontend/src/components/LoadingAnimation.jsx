import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

const LoadingAnimation = () => {

    const thinkingLabels = ["Thinking", "Analyzing", "Reasoning", "Generating"]
    const [labelIndex, setLabelIndex] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setLabelIndex(prev => (prev + 1) % thinkingLabels.length)
        }, 1800)

        return () => clearInterval(interval)
    }, [thinkingLabels.length])

    const label = thinkingLabels[labelIndex]

    return (
        <div className='flex items-center gap-3 max-w-[72%] py-1'>
            <div className='relative w-9 h-9 flex items-center justify-center shrink-0'>
                {
                    [0, 0.45, 0.9].map((delay, idx) => (
                        <motion.div
                            key={idx}
                            className='absolute inset-0 rounded-full border border-cyan-400/30'
                            initial={{ scale: 0.3, opacity: 0.55 }}
                            animate={{ scale: 1.7, opacity: 0 }}
                            transition={{
                                duration: 1.8,
                                repeat: Infinity,
                                delay,
                                ease: "easeOut"
                            }}

                        />
                    ))
                }
                <motion.span
                    className='w-2.5 h-2.5 rounded-full bg-linear-to-br from-cyan-300 to-violet-400'
                    style={{ boxShadow: "0 0 14px rgba(125, 211, 252, 0.55)" }}
                    animate={{ scale: [1, 1.25, 1] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                >

                </motion.span>

            </div>
            <div className='flex overflow-hidden'>
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={label}
                        className='flex'
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                    >
                        {
                            label.split("").map((char, idx) => (
                                <motion.div
                                    key={idx}
                                    className='text-[13px] font-medium tracking-wide text-slate-400'
                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                    transition={{
                                        duration: 1.4,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        delay: idx * 0.07
                                    }}
                                >
                                    {char}
                                </motion.div>
                            ))
                        }
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}

export default LoadingAnimation