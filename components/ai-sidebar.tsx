'use client'

import { cn } from "@/lib/utils"

interface AISidebarProps {
    className?: string
}

export function AISidebar({ className }: AISidebarProps) {
    return (
        <div className={cn("flex flex-col h-full bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800", className)}>
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">AI Collaboration</h2>
                <span className="text-xs text-zinc-500">Beta</span>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
                <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center bg-white dark:bg-zinc-950/50">
                    <p className="text-sm text-zinc-500 mb-2">Build your AI workflow here.</p>
                    <p className="text-xs text-zinc-400">Context aware chat, research tools, and more.</p>
                </div>
            </div>
        </div>
    )
}
