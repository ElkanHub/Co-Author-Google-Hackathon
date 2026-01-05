'use client'

import { useCurrentEditor } from '@tiptap/react'
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Heading1,
    Heading2,
    AlignLeft,
    AlignCenter,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

export function EditorBubbleMenu() {
    const { editor } = useCurrentEditor()
    const [bubbleParams, setBubbleParams] = useState<{ top: number; left: number; visible: boolean }>({
        top: 0,
        left: 0,
        visible: false,
    })

    useEffect(() => {
        if (!editor) return

        const updateBubble = () => {
            const { selection } = editor.state
            const isTextSelection = !selection.empty

            if (isTextSelection) {
                // We use standard browser selection for coordinates as it is reliable
                const domSelection = window.getSelection()
                if (domSelection && domSelection.rangeCount > 0) {
                    const range = domSelection.getRangeAt(0)
                    const rect = range.getBoundingClientRect()

                    // Show bubble 50px above selection center
                    setBubbleParams({
                        top: rect.top - 50,
                        left: rect.left + (rect.width / 2),
                        visible: true,
                    })
                }
            } else {
                setBubbleParams(prev => ({ ...prev, visible: false }))
            }
        }

        editor.on('selectionUpdate', updateBubble)
        editor.on('blur', () => setBubbleParams(prev => ({ ...prev, visible: false })))

        return () => {
            editor.off('selectionUpdate', updateBubble)
        }
    }, [editor])

    if (!editor || !bubbleParams.visible) {
        return null
    }

    const ToggleButton = ({
        isActive,
        onClick,
        children,
    }: {
        isActive: boolean
        onClick: () => void
        children: React.ReactNode
    }) => (
        <button
            onMouseDown={(e) => {
                e.preventDefault() // Prevent focus loss on click
                onClick()
            }}
            className={cn(
                "p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors",
                isActive && "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
            )}
        >
            {children}
        </button>
    )

    return (
        <div
            className="fixed z-50 flex items-center gap-1 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-xl transition-opacity duration-200 animate-in fade-in zoom-in-95"
            style={{
                top: `${bubbleParams.top}px`,
                left: `${bubbleParams.left}px`,
                transform: 'translateX(-50%)'
            }}
        >
            {/* Headings */}
            <div className="flex items-center gap-0.5 border-r border-zinc-200 dark:border-zinc-700 pr-1 mr-1">
                <ToggleButton
                    isActive={editor.isActive('heading', { level: 1 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                >
                    <Heading1 className="w-4 h-4" />
                </ToggleButton>
                <ToggleButton
                    isActive={editor.isActive('heading', { level: 2 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                >
                    <Heading2 className="w-4 h-4" />
                </ToggleButton>
            </div>

            {/* Styles */}
            <div className="flex items-center gap-0.5 border-r border-zinc-200 dark:border-zinc-700 pr-1 mr-1">
                <ToggleButton
                    isActive={editor.isActive('bold')}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                >
                    <Bold className="w-4 h-4" />
                </ToggleButton>
                <ToggleButton
                    isActive={editor.isActive('italic')}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                    <Italic className="w-4 h-4" />
                </ToggleButton>
                <ToggleButton
                    isActive={editor.isActive('underline')}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                >
                    <UnderlineIcon className="w-4 h-4" />
                </ToggleButton>
            </div>

            {/* Align */}
            <div className="flex items-center gap-0.5">
                <ToggleButton
                    isActive={editor.isActive({ textAlign: 'left' })}
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                >
                    <AlignLeft className="w-4 h-4" />
                </ToggleButton>
                <ToggleButton
                    isActive={editor.isActive({ textAlign: 'center' })}
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                >
                    <AlignCenter className="w-4 h-4" />
                </ToggleButton>
            </div>
        </div>
    )
}
