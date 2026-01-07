'use client'

import { useState } from 'react'
import { cn } from "@/lib/utils"
import { useAIStore, AICard } from "@/store/use-ai-store"
import { Sparkles, BookOpen, MessageSquare, AlertCircle, Copy, Trash2, Check, Search, X, Zap } from "lucide-react"
import { Typewriter } from "@/components/ui/typewriter"
import { marked } from "marked"

interface AISidebarProps {
    className?: string
}

function CardIcon({ type }: { type: AICard['type'] }) {
    switch (type) {
        case 'suggestion': return <Sparkles className="w-4 h-4 text-purple-400" />
        case 'citation': return <BookOpen className="w-4 h-4 text-blue-400" />
        case 'analysis': return <AlertCircle className="w-4 h-4 text-orange-400" />
        case 'action': return <Zap className="w-4 h-4 text-yellow-500" />
        default: return <MessageSquare className="w-4 h-4 text-zinc-400" />
    }
}

export function AISidebar({ className }: AISidebarProps) {
    const { cards } = useAIStore()
    const [searchQuery, setSearchQuery] = useState('')
    const [activeFilter, setActiveFilter] = useState('All')

    const filters = ['All', 'Action', 'Suggestion', 'Citation', 'Analysis', 'Feedback']

    const filteredCards = cards.filter(card => {
        const matchesType = activeFilter === 'All' || card.type === activeFilter.toLowerCase()
        const matchesSearch = card.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            card.reason?.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesType && matchesSearch
    })

    return (
        <div className={cn("flex flex-col h-full bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800", className)}>
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">AI Research Space</h2>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Live</span>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search cards..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-lg pl-8 pr-8 py-2 text-xs text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none mask-fade-right">
                    {filters.map(filter => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={cn(
                                "px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors whitespace-nowrap border",
                                activeFilter === filter
                                    ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100"
                                    : "bg-white dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                            )}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                {filteredCards.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center bg-white dark:bg-zinc-950/30 mt-8">
                        <p className="text-sm text-zinc-500 mb-2">
                            {searchQuery ? "No matching cards found." : "Build your AI workflow here."}
                        </p>
                        <p className="text-xs text-zinc-400">
                            {searchQuery ? "Try a different search term or filter." : "Start writing, and I will generate suggestions automatically."}
                        </p>
                    </div>
                ) : (
                    filteredCards.map((card) => (
                        <AICardItem key={card.id} card={card} />
                    ))
                )}
            </div>
        </div>
    )
}

function AICardItem({ card }: { card: AICard }) {
    const { deleteCard } = useAIStore()
    const [hasCopied, setHasCopied] = useState(false)

    const handleCopy = async () => {
        try {
            const html = await marked.parse(card.content)
            const typeHtml = "text/html"
            const typeText = "text/plain"
            const blobHtml = new Blob([html], { type: typeHtml })
            const blobText = new Blob([card.content], { type: typeText })
            const data = [new ClipboardItem({ [typeHtml]: blobHtml, [typeText]: blobText })]

            await navigator.clipboard.write(data)
            setHasCopied(true)
            setTimeout(() => setHasCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy rich text:', err)
            // Fallback to plain text
            navigator.clipboard.writeText(card.content)
            setHasCopied(true)
            setTimeout(() => setHasCopied(false), 2000)
        }
    }

    return (
        <div
            className="group relative bg-white dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all hover:border-zinc-300 dark:hover:border-zinc-700"
        >
            {/* Card Header */}
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                        <CardIcon type={card.type} />
                    </div>
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                        {card.type === 'action' && card.reason?.startsWith('Action:')
                            ? card.reason.split('-')[0].replace('Action:', '').trim()
                            : card.type}
                    </span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <button
                        onClick={handleCopy}
                        className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                        title="Copy to clipboard"
                    >
                        {hasCopied ? (
                            <Check className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                            <Copy className="w-3.5 h-3.5" />
                        )}
                    </button>
                    <button
                        onClick={() => deleteCard(card.id)}
                        className="p-1 text-zinc-400 hover:text-red-500 transition-colors rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                        title="Delete card"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            <div className="absolute top-4 right-4 group-hover:opacity-0 transition-opacity">
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
            <div>
                <Typewriter text={card.content} speed={card.fromDb ? 0 : 0.5} />
            </div>

            {/* Actions */}
            {card.actions && card.actions.length > 0 && (
                <div className="mt-3 flex items-center gap-2">
                    {card.actions.map((action, i) => (
                        <button
                            key={i}
                            onClick={action.onClick}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors border",
                                action.variant === 'secondary'
                                    ? "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                    : "bg-indigo-500 text-white border-transparent hover:bg-indigo-600 shadow-sm"
                            )}
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
