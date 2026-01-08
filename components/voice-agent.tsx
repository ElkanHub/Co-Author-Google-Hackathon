'use client'

import { useState } from 'react'
import { Mic, MicOff, Radio, StopCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLiveApi } from '@/hooks/use-live-api'


// NOTE: Hardcoding key for prototype if env not set, 
// likely user needs to set GEMINI_API_KEY
const API_KEY = process.env.GEMINI_API_KEY || '';

interface VoiceAgentProps {
    initialContext: string;
    onContentGenerated: (type: string, title: string, content: string) => void;
}

export function VoiceAgent({ initialContext, onContentGenerated }: VoiceAgentProps) {
    const { connect, disconnect, isConnected, isSpeaking } = useLiveApi({
        onToolCall: async (name, args) => {
            if (name === 'write_to_ai_space') {
                onContentGenerated(args.type, args.title, args.content);
            }
        }
    });

    const handleToggle = () => {
        if (isConnected) {
            disconnect();
        } else {
            if (!API_KEY) {
                alert("Please set GEMINI_API_KEY in .env");
                return;
            }
            connect(API_KEY, initialContext);
        }
    };

    return (
        <div className={cn(
            "fixed bottom-8 left-1/2 -translate-x-1/2 transition-all duration-300 z-50",
            isConnected ? "w-auto" : "w-auto"
        )}>
            <div className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-full shadow-lg border border-white/10 backdrop-blur-md transition-all",
                isConnected ? "bg-red-500/90 text-white shadow-red-500/20" : "bg-black/90 text-white"
            )}>
                {/* Connection Status / Visualizer */}
                <div className="flex items-center justify-center">
                    {isConnected ? (
                        <div className="flex gap-1 h-4 items-center">
                            {/* Fake visualizer bars */}
                            <div className={cn("w-1 bg-white rounded-full transition-all duration-100", isSpeaking ? "h-4 animate-pulse" : "h-1")} />
                            <div className={cn("w-1 bg-white rounded-full transition-all duration-100 delay-75", isSpeaking ? "h-5 animate-pulse" : "h-2")} />
                            <div className={cn("w-1 bg-white rounded-full transition-all duration-100 delay-100", isSpeaking ? "h-3 animate-pulse" : "h-1")} />
                        </div>
                    ) : (
                        <Radio className="w-4 h-4 text-zinc-400" />
                    )}
                </div>

                <div className="h-4 w-px bg-white/20 mx-1" />

                <button
                    onClick={handleToggle}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity whitespace-nowrap"
                >
                    {isConnected ? (
                        <>
                            <StopCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">End Session</span>
                        </>
                    ) : (
                        <>
                            <Mic className="w-4 h-4" />
                            <span className="text-sm font-medium">Research Companion</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
