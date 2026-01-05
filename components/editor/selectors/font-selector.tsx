import { Editor } from '@tiptap/react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FontSelectorProps {
    editor: Editor
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

const FONTS = [
    { name: 'Inter', value: 'Inter' },
    { name: 'Arial', value: 'Arial' },
    { name: 'Helvetica', value: 'Helvetica' },
    { name: 'Times New Roman', value: 'Times New Roman' },
    { name: 'Courier New', value: 'Courier New' },
    { name: 'Georgia', value: 'Georgia' },
    { name: 'Verdana', value: 'Verdana' },
    { name: 'Comic Sans MS', value: 'Comic Sans MS' },
]

export function FontSelector({ editor, isOpen, onOpenChange }: FontSelectorProps) {
    const currentFont = editor.getAttributes('textStyle').fontFamily || 'Inter'

    return (
        <div className="relative">
            <button
                className="flex items-center gap-1 p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 h-8 text-sm"
                onClick={() => onOpenChange(!isOpen)}
            >
                <span className="truncate max-w-[100px]">{currentFont.replace(/['"]+/g, '')}</span>
                <ChevronDown className="w-3 h-3 opacity-50" />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-20"
                        onClick={() => onOpenChange(false)}
                    />
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded shadow-lg z-30 max-h-60 overflow-y-auto py-1">
                        {FONTS.map((font) => (
                            <button
                                key={font.value}
                                onClick={() => {
                                    editor.chain().focus().setFontFamily(font.value).run()
                                    onOpenChange(false)
                                }}
                                className={cn(
                                    "w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-between",
                                    (currentFont === font.value || currentFont.includes(font.value)) && "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                                )}
                                style={{ fontFamily: font.value }}
                            >
                                {font.name}
                                {(currentFont === font.value || currentFont.includes(font.value)) && <Check className="w-3 h-3" />}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
