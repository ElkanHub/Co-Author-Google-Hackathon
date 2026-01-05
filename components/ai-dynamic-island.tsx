'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, X, Sparkles, Loader2 } from 'lucide-react'
import { useAIStore } from '@/store/use-ai-store'
import { cn } from '@/lib/utils'

export function AIDynamicIsland() {
    const { writerState, voiceState, isMuted, toggleMute, setVoiceState } = useAIStore()

    // Derived state for layout variants
    const isVoiceActive = voiceState === 'active'
    const isWriting = writerState === 'writing'
    const isThinking = writerState === 'thinking'

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">

            <AnimatePresence mode="wait">
                <motion.div
                    layout
                    initial={{ borderRadius: 24 }}
                    animate={{
                        width: isVoiceActive ? 'auto' : isWriting ? 200 : isThinking ? 160 : 140,
                        height: isVoiceActive ? 60 : 48,
                        borderRadius: 30
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={cn(
                        "bg-black dark:bg-black/90 backdrop-blur-md text-white shadow-xl flex items-center justify-center overflow-hidden border border-zinc-800/50 relative px-1",
                        isVoiceActive ? "px-4" : "px-1"
                    )}
                >
                    <motion.div layout className="flex items-center gap-3 w-full justify-between min-w-0">

                        {/* VOICE MODE */}
                        {isVoiceActive ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-4 w-full px-2"
                            >
                                {/* Waveform Visualizer (Mock) */}
                                <div className="flex items-center gap-1 h-4">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <motion.div
                                            key={i}
                                            animate={{ height: [4, 12, 6, 14, 4] }}
                                            transition={{ repeat: Infinity, duration: 1, delay: i * 0.1 }}
                                            className="w-1 bg-green-400 rounded-full"
                                        />
                                    ))}
                                </div>

                                <span className="text-sm font-medium whitespace-nowrap">Listening...</span>

                                <div className="flex items-center gap-2 ml-auto">
                                    <button
                                        onClick={toggleMute}
                                        className={cn(
                                            "p-2 rounded-full transition-colors",
                                            isMuted ? "bg-red-500/20 text-red-400" : "bg-white/10 hover:bg-white/20"
                                        )}
                                    >
                                        {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => setVoiceState('inactive')}
                                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            /* IDLE / WRITING MODE */
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center justify-center w-full px-3 gap-2"
                            >
                                {/* Status Icon */}
                                <div className="relative flex items-center justify-center w-6 h-6">
                                    {isThinking ? (
                                        <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                                    ) : isWriting ? (
                                        <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                                    ) : (
                                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                    )}
                                </div>

                                {/* Status Text or Call Action */}
                                <div className="flex flex-col items-start justify-center h-full min-w-[80px]">
                                    {isThinking ? (
                                        <span className="text-xs font-medium text-zinc-300">Thinking...</span>
                                    ) : isWriting ? (
                                        <span className="text-xs font-medium text-purple-300">Writing...</span>
                                    ) : (
                                        <button
                                            onClick={() => setVoiceState('active')}
                                            className="text-xs font-medium hover:text-white text-zinc-300 transition-colors flex items-center gap-1"
                                        >
                                            <Mic className="w-3 h-3" />
                                            <span>Ask AI</span>
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
