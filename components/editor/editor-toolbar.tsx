'use client'

import { type Editor } from '@tiptap/react'
import {
    Bold,
    Italic,
    Underline,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Indent,
    Outdent,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface EditorToolbarProps {
    editor: Editor | null
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
    if (!editor) {
        return null
    }

    const ToggleButton = ({
        isActive,
        onClick,
        children,
        disabled = false,
    }: {
        isActive: boolean
        onClick: () => void
        children: React.ReactNode
        disabled?: boolean
    }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "p-2 rounded hover:bg-zinc-100 transition-colors dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
                isActive && "bg-zinc-200 dark:bg-zinc-700 text-black dark:text-white",
                disabled && "opacity-50 cursor-not-allowed"
            )}
        >
            {children}
        </button>
    )

    return (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-10">

            {/* Headings */}
            <div className="flex items-center gap-0.5 border-r border-zinc-200 dark:border-zinc-800 pr-2 mr-2">
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
                <ToggleButton
                    isActive={editor.isActive('heading', { level: 3 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                >
                    <Heading3 className="w-4 h-4" />
                </ToggleButton>
            </div>

            {/* Formatting */}
            <div className="flex items-center gap-0.5 border-r border-zinc-200 dark:border-zinc-800 pr-2 mr-2">
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
                    <Underline className="w-4 h-4" />
                </ToggleButton>
            </div>

            {/* Alignment */}
            <div className="flex items-center gap-0.5 border-r border-zinc-200 dark:border-zinc-800 pr-2 mr-2">
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
                <ToggleButton
                    isActive={editor.isActive({ textAlign: 'right' })}
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                >
                    <AlignRight className="w-4 h-4" />
                </ToggleButton>
                <ToggleButton
                    isActive={editor.isActive({ textAlign: 'justify' })}
                    onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                >
                    <AlignJustify className="w-4 h-4" />
                </ToggleButton>
            </div>

            {/* Lists & Indent */}
            <div className="flex items-center gap-0.5">
                <ToggleButton
                    isActive={editor.isActive('bulletList')}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                >
                    <List className="w-4 h-4" />
                </ToggleButton>
                <ToggleButton
                    isActive={editor.isActive('orderedList')}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                >
                    <ListOrdered className="w-4 h-4" />
                </ToggleButton>
                {/* Indent Logic mainly for lists */}
                <ToggleButton
                    isActive={false}
                    //@ts-ignore - custom extension command check
                    onClick={() => editor.chain().focus().indent().run()}
                    disabled={false}
                >
                    <Indent className="w-4 h-4" />
                </ToggleButton>
                <ToggleButton
                    isActive={false}
                    //@ts-ignore
                    onClick={() => editor.chain().focus().outdent().run()}
                    disabled={false}
                >
                    <Outdent className="w-4 h-4" />
                </ToggleButton>
            </div>
        </div>
    )
}
