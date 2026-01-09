'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, X, Sparkles, Loader2 } from 'lucide-react'
import { useLiveApi } from '@/hooks/use-live-api'
import { useAIStore } from '@/store/use-ai-store'
import { cn } from '@/lib/utils'

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

interface AIDynamicIslandProps {
    className?: string
    initialContext?: string
    onContentGenerated?: (type: string, title: string, content: string) => void
}

export function AIDynamicIsland({ className, initialContext = "", onContentGenerated }: AIDynamicIslandProps) {
    const { writerState, voiceState, isMuted, toggleMute, setVoiceState, isPaused, togglePause } = useAIStore()

    const { connect, disconnect, isConnected, isSpeaking } = useLiveApi({
        onToolCall: async (name, args) => {
            if (name === 'write_to_ai_space' && onContentGenerated) {
                onContentGenerated(args.type, args.title, args.content);
            }
        },
        muted: isMuted
    });

    // Handle Voice Activation/Deactivation via Store
    // When store says 'active', we try to connect if not connected
    // When store says 'inactive', we disconnect if connected
    React.useEffect(() => {
        if (voiceState === 'active' && !isConnected) {
            if (!API_KEY) {
                alert("Please set NEXT_PUBLIC_GEMINI_API_KEY in .env");
                setVoiceState('inactive');
                return;
            }
            connect(API_KEY, initialContext);
        } else if (voiceState === 'inactive' && isConnected) {
            disconnect();
        }
    }, [voiceState, isConnected, connect, disconnect, initialContext, setVoiceState]);

    // Derived state for layout variants
    // Use local isConnected/isSpeaking for more accurate visual feedback
    const isVoiceActive = voiceState === 'active'
    const isWriting = writerState === 'writing'
    const isThinking = writerState === 'thinking'

    // Calculate Width
    // If Voice is Active & Paused: Need wide (approx 450px)
    // If Voice is Active: Need wide (approx  350px)
    // If Idle & Paused: 200px
    // If Idle: 150px
    // If Writing: 220px
    // If Thinking: 180px

    const getWidth = () => {
        if (isVoiceActive) return isPaused ? 360 : 280
        if (isWriting) return 220
        if (isThinking) return 180
        if (isPaused) return 200
        return 150
    }

    return (
        <div className={cn("flex flex-col items-center gap-1 z-50 pointer-events-none", className)} >
            <motion.div
                layout
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="pointer-events-auto"
            >
                <motion.div
                    layout
                    style={{ borderRadius: 32 }}
                    animate={{
                        width: getWidth(),
                        height: 52, // Unify height to avoid jumps
                    }}
                    transition={{
                        type: "spring",
                        bounce: 0.15,
                        duration: 0.7
                    }}
                    className={cn(
                        "bg-black dark:bg-black/90 backdrop-blur-md text-white shadow-2xl flex items-center justify-center overflow-hidden border border-zinc-800/50 relative mx-auto",
                        isVoiceActive ? "px-1 pr-2" : "px-3"
                    )}
                >
                    <AnimatePresence mode="popLayout" initial={false}>
                        {isVoiceActive ? (
                            <motion.div
                                key="voice"
                                initial={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
                                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, scale: 0.95, filter: 'blur(2px)' }}
                                transition={{ duration: 0.4, ease: "easeInOut" }}
                                className="flex items-center gap-3 w-full px-2 justify-between"
                            >
                                {/* Waveform Visualizer */}
                                <div className="flex items-center gap-0.5 h-8 w-12 justify-center shrink-0">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <motion.div
                                            key={i}
                                            animate={{
                                                height: (isSpeaking && !isMuted) ? [6, 16, 8, 20, 6] : 4,
                                                backgroundColor: isMuted ? "#52525b" : (isSpeaking ? "#34d399" : "#10b981")
                                            }}
                                            transition={{
                                                repeat: isMuted ? 0 : Infinity,
                                                duration: (isSpeaking && !isMuted) ? 0.4 : 0.5,
                                                ease: "easeInOut",
                                                delay: i * 0.05
                                            }}
                                            className="w-1 rounded-full"
                                        />
                                    ))}
                                </div>

                                <span className="text-sm font-medium text-zinc-200 shrink-0">
                                    {isSpeaking ? "Speaking..." : "Listening..."}
                                </span>

                                {/* Divider */}
                                <div className="w-px h-4 bg-zinc-800 shrink-0" />

                                {/* Pause Toggle inside Voice UI */}
                                <button
                                    onClick={togglePause}
                                    className={cn(
                                        "p-1.5 rounded-full transition-colors flex items-center justify-center shrink-0",
                                        isPaused ? "text-yellow-500 bg-yellow-500/10" : "text-zinc-600 hover:text-white"
                                    )}
                                    title={isPaused ? "Resume Autonomy" : "Pause Autonomy"}
                                >
                                    {isPaused ? (
                                        <div className="flex items-center gap-1.5 px-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                                            <span className="text-[10px] uppercase font-bold tracking-wider">Paused</span>
                                        </div>
                                    ) : (
                                        <div className="w-1.5 h-1.5 rounded-sm bg-zinc-500" />
                                    )}
                                </button>

                                <div className="flex items-center gap-1.5 ml-auto shrink-0">
                                    <button
                                        onClick={toggleMute}
                                        className={cn(
                                            "p-1.5 rounded-full transition-all duration-200",
                                            isMuted ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                                        )}
                                    >
                                        {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                                    </button>
                                    <button
                                        onClick={() => setVoiceState('inactive')}
                                        className="p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-all duration-200"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="status"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center justify-center w-full gap-2.5 absolute inset-0"
                            >
                                {/* Status Icon */}
                                <div className="relative flex items-center justify-center">
                                    {isThinking ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                                    ) : isWriting ? (
                                        <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                                    ) : (
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                    )}
                                </div>

                                {/* Status Text or Call Action */}
                                <div className="flex items-center">
                                    {isThinking ? (
                                        <span className="text-sm font-medium text-zinc-300">Thinking</span>
                                    ) : isWriting ? (
                                        <span className="text-sm font-medium text-purple-200">Writing</span>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setVoiceState('active')}
                                                className="text-sm font-medium text-zinc-300 hover:text-white transition-colors flex items-center gap-2"
                                            >
                                                <span className="opacity-50">Ask</span>
                                                <span>AI</span>
                                            </button>

                                            {/* Divider */}
                                            <div className="w-px h-3 bg-zinc-700 mx-1" />

                                            <button
                                                onClick={togglePause}
                                                className={cn(
                                                    "p-1 rounded-full transition-colors flex items-center justify-center",
                                                    isPaused ? "text-yellow-500 bg-yellow-500/10" : "text-zinc-600 hover:text-white"
                                                )}
                                                title={isPaused ? "Resume Autonomy" : "Pause Autonomy"}
                                            >
                                                {isPaused ? (
                                                    <div className="flex items-center gap-1.5 px-1">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                                                        <span className="text-[10px] uppercase font-bold tracking-wider">Paused</span>
                                                    </div>
                                                ) : (
                                                    <div className="w-1.5 h-1.5 rounded-sm bg-zinc-500" />
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        </div >
    )
}
