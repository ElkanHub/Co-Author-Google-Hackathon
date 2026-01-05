import { Editor } from '@tiptap/react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface FontSizeSelectorProps {
    editor: Editor
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

const SIZES = [
    '8pt', '10pt', '11pt', '12pt', '14pt', '16pt', '18pt', '24pt', '30pt', '36pt', '48pt', '60pt', '72pt', '96pt'
]

export function FontSizeSelector({ editor, isOpen, onOpenChange }: FontSizeSelectorProps) {
    // Tiptap textStyle doesn't have fontSize by default, usually handled by custom extension or attribute
    // We assume we will configure TextStyle to support it or use a separate extension.
    // Actually, Tiptap doesn't have a built-in FontSize extension. 
    // We typically use TextStyle with a custom attribute.
    // For this implementation, we'll assume we're adding a 'fontSize' attribute to TextStyle.

    // Fallback if not set
    const currentSize = editor.getAttributes('textStyle').fontSize || '12pt'

    // Handling custom input
    const [inputValue, setInputValue] = useState(currentSize)

    return (
        <div className="relative">
            <button
                className="flex items-center gap-1 p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 h-8 text-sm w-16 justify-between"
                onClick={() => onOpenChange(!isOpen)}
            >
                <span>{currentSize}</span>
                <ChevronDown className="w-3 h-3 opacity-50" />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-20"
                        onClick={() => onOpenChange(false)}
                    />
                    <div className="absolute top-full left-0 mt-1 w-24 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded shadow-lg z-30 max-h-60 overflow-y-auto py-1">
                        {SIZES.map((size) => (
                            <button
                                key={size}
                                onClick={() => {
                                    // Relies on TextStyle extended configuration
                                    // @ts-ignore
                                    editor.chain().focus().setMark('textStyle', { fontSize: size }).run()
                                    onOpenChange(false)
                                }}
                                className={cn(
                                    "w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-between",
                                    currentSize === size && "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                                )}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
