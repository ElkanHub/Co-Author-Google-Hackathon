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
    Sparkles,
    PentagonIcon,
    Scissors,
    Copy,
    Clipboard,
    CheckSquare,
    ChevronRight,
    Grab
} from "lucide-react"
import { useEffect, useRef, useState, useLayoutEffect } from "react"
import { cn } from "@/lib/utils"

interface EditorContextMenuProps {
    x: number
    y: number
    onClose: () => void
    onAction: (action: string) => void
}

const STANDARD_ACTIONS = [
    { label: "Copy", action: "copy", icon: Copy, shortcut: "⌘C" },
    { label: "Cut", action: "cut", icon: Scissors, shortcut: "⌘X" },
    { label: "Paste", action: "paste", icon: Clipboard, shortcut: "⌘V" },
    { label: "Select All", action: "select-all", icon: CheckSquare, shortcut: "⌘A" },
]

const AI_ACTIONS = [
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
    const [style, setStyle] = useState<{ top: number, left: number, visibility: 'hidden' | 'visible' }>({ top: y, left: x, visibility: 'hidden' })
    const [showAISubmenu, setShowAISubmenu] = useState(false)

    // Viewport Collision Detection
    useLayoutEffect(() => {
        if (menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect()
            const viewportWidth = window.innerWidth
            const viewportHeight = window.innerHeight

            let newTop = y
            let newLeft = x

            // Check right edge
            if (x + rect.width > viewportWidth) {
                newLeft = viewportWidth - rect.width - 10
            }

            // Check bottom edge
            if (y + rect.height > viewportHeight) {
                newTop = viewportHeight - rect.height - 10
            }

            setStyle({ top: newTop, left: newLeft, visibility: 'visible' })
        }
    }, [x, y])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose()
            }
        }
        const handleScroll = () => onClose()

        document.addEventListener("mousedown", handleClickOutside)
        document.addEventListener("scroll", handleScroll, true)

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
            document.removeEventListener("scroll", handleScroll, true)
        }
    }, [onClose])

    // Determine if submenu should open to the left
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1000
    const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 1000
    const submenuOpensLeft = style.left + 400 > windowWidth

    // Determine if submenu should open upwards
    // Main menu top + approximate offset to trigger (150px) + submenu height (280px)
    const submenuOpensUp = (style.top + 150 + 280) > windowHeight

    return (
        <div
            ref={menuRef}
            className="fixed z-50 w-[180px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-lg p-1 animate-in fade-in zoom-in-95 duration-100 ease-out flex flex-col gap-0.5"
            style={{ top: style.top, left: style.left, visibility: style.visibility }}
        >
            {/* Standard Actions */}
            {STANDARD_ACTIONS.map((item) => (
                <button
                    key={item.label}
                    onClick={() => {
                        onAction(item.action)
                        onClose()
                    }}
                    className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors text-left"
                >
                    <div className="flex items-center gap-2">
                        <item.icon className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{item.label}</span>
                    </div>
                    {item.shortcut && <span className="text-[10px] text-zinc-400">{item.shortcut}</span>}
                </button>
            ))}

            <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-1 mx-2" />

            {/* AI Submenu Trigger */}
            <div
                className="relative"
                onMouseEnter={() => setShowAISubmenu(true)}
                onMouseLeave={() => setShowAISubmenu(false)}
            >
                <button
                    className={cn(
                        "w-full flex items-center justify-between px-2 py-1.5 text-xs rounded transition-colors text-left",
                        showAISubmenu
                            ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300"
                            : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    )}
                >
                    <div className="flex items-center gap-2">
                        <PentagonIcon className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="font-medium">AI Actions</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                </button>

                {/* Submenu */}
                {showAISubmenu && (
                    <div
                        className={cn(
                            "absolute min-w-[180px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-lg p-1 animate-in fade-in duration-100",
                            submenuOpensLeft
                                ? "right-full mr-1 slide-in-from-right-2"
                                : "left-full ml-1 slide-in-from-left-2",
                            submenuOpensUp
                                ? "bottom-0 origin-bottom"
                                : "top-0 origin-top"
                        )}
                    >
                        {AI_ACTIONS.map((item) => (
                            <button
                                key={item.label}
                                onClick={() => {
                                    onAction(item.action)
                                    onClose()
                                }}
                                className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-300 rounded transition-colors text-left"
                            >
                                <item.icon className={cn("w-3.5 h-3.5", item.color)} />
                                {item.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
