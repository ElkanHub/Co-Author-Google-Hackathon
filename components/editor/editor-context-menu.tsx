'use client'

import {
    Quote,
    RefreshCw,
    FileText,
    Maximize2,
    Search,
    Scale,
    BookOpen,
    Book,
    Sparkles
} from "lucide-react"
import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface EditorContextMenuProps {
    x: number
    y: number
    onClose: () => void
    onAction: (action: string) => void
}

const ACTIONS = [
    { label: "Cite", action: "Cite", icon: Quote, color: "text-blue-500" },
    { label: "Paraphrase", action: "Paraphrase", icon: RefreshCw, color: "text-purple-500" },
    { label: "Summarize", action: "Summarize", icon: FileText, color: "text-green-500" },
    { label: "Expand", action: "Expand", icon: Maximize2, color: "text-orange-500" },
    { label: "Analyze", action: "Analyze", icon: Search, color: "text-indigo-500" },
    { label: "Counterarguments", action: "Counterarguments", icon: Scale, color: "text-red-500" },
    { label: "Suggest sources", action: "Suggest sources", icon: BookOpen, color: "text-teal-500" },
    { label: "Define terms", action: "Define terms", icon: Book, color: "text-yellow-500" },
]

export function EditorContextMenu({ x, y, onClose, onAction }: EditorContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose()
            }
        }

        // Close on scroll too
        const handleScroll = () => onClose()

        document.addEventListener("mousedown", handleClickOutside)
        document.addEventListener("scroll", handleScroll, true)

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
            document.removeEventListener("scroll", handleScroll, true)
        }
    }, [onClose])

    // Adjust position if near screen edge (basic)
    // We can assume x,y are client coordinates
    const style = {
        top: y,
        left: x,
    }

    return (
        <div
            ref={menuRef}
            className="fixed z-50 min-w-[220px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 ease-out"
            style={style}
        >
            <div className="px-3 py-2 bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800/50 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">AI Actions</span>
            </div>
            <div className="p-1">
                {ACTIONS.map((item) => (
                    <button
                        key={item.label}
                        onClick={() => {
                            onAction(item.action)
                            onClose()
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-300 rounded-md transition-colors text-left"
                    >
                        <item.icon className={cn("w-4 h-4", item.color)} />
                        {item.label}
                    </button>
                ))}
            </div>
        </div>
    )
}
