'use client'

import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import FontFamily from '@tiptap/extension-font-family'
import { TextStyle } from '@tiptap/extension-text-style'
import CharacterCount from '@tiptap/extension-character-count'

import { useEditorStore } from '@/store/use-editor-store'
import { EditorToolbar } from './editor-toolbar'
import { FontSize } from './extensions/font-size'
import { Indent } from './extensions/indent'
import { ResizableImage } from './extensions/resizable-image'
import { useEffect } from 'react'

export function UserEditor() {
    const { setContent, setSelection, setActiveHeading } = useEditorStore()

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Placeholder.configure({
                placeholder: 'Start writing your research...',
            }),
            Typography,
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph', 'image'],
            }),
            Indent,
            FontSize,
            Highlight.configure({ multicolor: true }),
            Image.configure({
                allowBase64: true,
                inline: true,
            }).extend({
                addNodeView() {
                    return ReactNodeViewRenderer(ResizableImage)
                },
            }),
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            TextStyle,
            FontFamily,
            CharacterCount,
        ],
        editorProps: {
            attributes: {
                class: 'prose prose-zinc prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[calc(100vh-200px)] py-8 px-12 bg-white dark:bg-zinc-950',
            },
        },
        onUpdate: ({ editor }) => {
            setContent(editor.getText())
            // Note: We might want to persist HTML or JSON for rich features, asking user store updates if needed.
        },
        onSelectionUpdate: ({ editor }) => {
            const { from, to } = editor.state.selection
            setSelection({ from, to })
        },
        immediatelyRender: false,
    })

    // Cleanup
    useEffect(() => {
        return () => {
            editor?.destroy()
        }
    }, [editor])

    if (!editor) {
        return null
    }

    return (
        <div className="w-full flex flex-col h-full bg-white dark:bg-zinc-950 shadow-sm border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
            <EditorToolbar editor={editor} />
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800 relative">
                <EditorContent editor={editor} />
            </div>
            {/* Character Count Footer */}
            <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 flex justify-end gap-4 bg-white dark:bg-zinc-950">
                <span>{editor.storage.characterCount.words()} words</span>
                <span>{editor.storage.characterCount.characters()} characters</span>
            </div>
        </div>
    )
}
