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
    Highlighter,
    Image as ImageIcon,
    Table as TableIcon,
    Download,
    Upload,
    Import,
    MoreHorizontal,
    Plus,
    Trash,
    Columns,
    Rows
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { FontSelector } from './selectors/font-selector'
import { FontSizeSelector } from './selectors/font-size-selector'
import { useRef, useState } from 'react'
import { exportToPdf, exportToDocx, exportToMarkdown, exportToLatex } from '@/lib/editor/export-utils'
import { importFromDocx, importFromMarkdown, importFromText } from '@/lib/editor/import-utils'

interface EditorToolbarProps {
    editor: Editor | null
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const importInputRef = useRef<HTMLInputElement>(null)
    const [isFontOpen, setIsFontOpen] = useState(false)
    const [isSizeOpen, setIsSizeOpen] = useState(false)
    const [isExportOpen, setIsExportOpen] = useState(false)

    if (!editor) {
        return null
    }

    const ToggleButton = ({
        isActive,
        onClick,
        children,
        disabled = false,
        title = "",
    }: {
        isActive: boolean
        onClick: () => void
        children: React.ReactNode
        disabled?: boolean
        title?: string
    }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={cn(
                "p-2 rounded hover:bg-zinc-100 transition-colors dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
                isActive && "bg-zinc-200 dark:bg-zinc-700 text-black dark:text-white",
                disabled && "opacity-50 cursor-not-allowed"
            )}
        >
            {children}
        </button>
    )

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                editor.chain().focus().setImage({ src: e.target?.result as string }).run()
            }
            reader.readAsDataURL(file)
        }
        // Reset input
        e.target.value = ''
    }

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            if (file.name.endsWith('.docx')) {
                await importFromDocx(file, editor)
            } else if (file.name.endsWith('.md')) {
                await importFromMarkdown(file, editor)
            } else {
                await importFromText(file, editor)
            }
        } catch (err) {
            console.error('Import failed', err)
            alert('Import failed. See console for details.')
        }
        e.target.value = ''
    }


    return (
        <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-10 flex flex-col">
            <div className="flex flex-wrap items-center gap-1 p-2">

                {/* File Operations */}
                <div className="flex items-center gap-0.5 border-r border-zinc-200 dark:border-zinc-800 pr-2 mr-2">
                    <div className="relative">
                        <ToggleButton
                            isActive={false}
                            onClick={() => setIsExportOpen(!isExportOpen)}
                            title="Export"
                        >
                            <Upload className="w-4 h-4" />
                        </ToggleButton>
                        {isExportOpen && (
                            <>
                                <div className="fixed inset-0 z-20" onClick={() => setIsExportOpen(false)} />
                                <div className="absolute top-full left-0 mt-1 w-32 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded shadow-lg z-30 py-1">
                                    <button onClick={() => { exportToPdf(editor); setIsExportOpen(false) }} className="w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">PDF</button>
                                    <button onClick={() => { exportToDocx(editor); setIsExportOpen(false) }} className="w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">DOCX</button>
                                    <button onClick={() => { exportToLatex(editor); setIsExportOpen(false) }} className="w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">LaTeX</button>
                                    <button onClick={() => { exportToMarkdown(editor); setIsExportOpen(false) }} className="w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">Markdown</button>
                                </div>
                            </>
                        )}
                    </div>

                    <ToggleButton
                        isActive={false}
                        onClick={() => importInputRef.current?.click()}
                        title="Import"
                    >
                        <Import className="w-4 h-4" />
                    </ToggleButton>
                    <input
                        type="file"
                        ref={importInputRef}
                        className="hidden"
                        accept=".docx,.md,.txt"
                        onChange={handleImport}
                    />
                </div>

                {/* Typography */}
                <div className="flex items-center gap-2 border-r border-zinc-200 dark:border-zinc-800 pr-2 mr-2">
                    <FontSelector editor={editor} isOpen={isFontOpen} onOpenChange={setIsFontOpen} />
                    <FontSizeSelector editor={editor} isOpen={isSizeOpen} onOpenChange={setIsSizeOpen} />
                </div>

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
                </div>

                {/* Basic Formatting */}
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
                    <ToggleButton
                        isActive={editor.isActive('highlight')}
                        onClick={() => editor.chain().focus().toggleHighlight().run()}
                    >
                        <Highlighter className="w-4 h-4" />
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

                {/* Lists */}
                <div className="flex items-center gap-0.5 border-r border-zinc-200 dark:border-zinc-800 pr-2 mr-2">
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
                    <ToggleButton
                        isActive={false}
                        //@ts-ignore
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

                {/* Inserts: Image & Table */}
                <div className="flex items-center gap-0.5">
                    <ToggleButton
                        isActive={false}
                        onClick={() => fileInputRef.current?.click()}
                        title="Insert Image"
                    >
                        <ImageIcon className="w-4 h-4" />
                    </ToggleButton>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                    />

                    <ToggleButton
                        isActive={editor.isActive('table')}
                        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                        title="Insert Table"
                    >
                        <TableIcon className="w-4 h-4" />
                    </ToggleButton>
                </div>
            </div>

            {/* Table Context Menu (Visible only when table active) */}
            {editor.isActive('table') && (
                <div className="flex flex-wrap items-center gap-1 p-1 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
                    <span className="px-2 font-medium">Table:</span>
                    <button onClick={() => editor.chain().focus().addColumnBefore().run()} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded" title="Add Col Before"><Columns className="w-3 h-3" /><span className="sr-only">Col Before</span></button>
                    <button onClick={() => editor.chain().focus().addColumnAfter().run()} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded" title="Add Col After"><Columns className="w-3 h-3 rotate-180" /><span className="sr-only">Col After</span></button>
                    <button onClick={() => editor.chain().focus().deleteColumn().run()} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-red-500" title="Delete Col"><Trash className="w-3 h-3" /><span className="sr-only">Del Col</span></button>
                    <div className="w-px h-3 bg-zinc-300 dark:bg-zinc-600 mx-1" />
                    <button onClick={() => editor.chain().focus().addRowBefore().run()} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded" title="Add Row Before"><Rows className="w-3 h-3" /><span className="sr-only">Row Before</span></button>
                    <button onClick={() => editor.chain().focus().addRowAfter().run()} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded" title="Add Row After"><Rows className="w-3 h-3 rotate-180" /><span className="sr-only">Row After</span></button>
                    <button onClick={() => editor.chain().focus().deleteRow().run()} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-red-500" title="Delete Row"><Trash className="w-3 h-3" /><span className="sr-only">Del Row</span></button>
                    <div className="w-px h-3 bg-zinc-300 dark:bg-zinc-600 mx-1" />
                    <button onClick={() => editor.chain().focus().deleteTable().run()} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-red-500 font-medium">Delete Table</button>
                </div>
            )}
        </div>
    )
}

