'use client'

import { cn } from "@/lib/utils"
import { useAIStore, AICard } from "@/store/use-ai-store"
import { Sparkles, BookOpen, MessageSquare, AlertCircle } from "lucide-react"

interface AISidebarProps {
    className?: string
}

function CardIcon({ type }: { type: AICard['type'] }) {
    switch (type) {
        case 'suggestion': return <Sparkles className="w-4 h-4 text-purple-400" />
        case 'citation': return <BookOpen className="w-4 h-4 text-blue-400" />
        case 'analysis': return <AlertCircle className="w-4 h-4 text-orange-400" />
        default: return <MessageSquare className="w-4 h-4 text-zinc-400" />
    }
}

export function AISidebar({ className }: AISidebarProps) {
    const { cards } = useAIStore()

    return (
        <div className={cn("flex flex-col h-full bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800", className)}>
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Intelligence Stream</h2>
                </div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Live</span>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                {cards.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center bg-white dark:bg-zinc-950/30 mt-8">
                        <p className="text-sm text-zinc-500 mb-2">Build your AI workflow here.</p>
                        <p className="text-xs text-zinc-400">Start writing, and I will generate suggestions automatically.</p>
                    </div>
                ) : (
                    cards.map((card) => (
                        <div
                            key={card.id}
                            className="group relative bg-white dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all hover:border-zinc-300 dark:hover:border-zinc-700"
                        >
                            {/* Card Header */}
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                                        <CardIcon type={card.type} />
                                    </div>
                                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                                        {card.type}
                                    </span>
                                </div>
                                <span className="text-[10px] text-zinc-400">
                                    {card.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            {/* Reason Context */}
                            {card.reason && (
                                <div className="mb-3 px-2 py-1.5 bg-zinc-50 dark:bg-zinc-900 rounded text-xs text-zinc-500 italic border-l-2 border-zinc-200 dark:border-zinc-700">
                                    "{card.reason}"
                                </div>
                            )}

                            {/* Content */}
                            <div className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                                {card.content}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
