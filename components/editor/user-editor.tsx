'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { useEditorStore } from '@/store/use-editor-store'
import { EditorToolbar } from './editor-toolbar'
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
                types: ['heading', 'paragraph'],
            }),
        ],
        editorProps: {
            attributes: {
                class: 'prose prose-slate prose-lg max-w-none focus:outline-none min-h-[calc(100vh-200px)] py-8 px-12 bg-white dark:bg-zinc-950 dark:text-zinc-100',
            },
        },
        onUpdate: ({ editor }) => {
            setContent(editor.getText())
        },
        onSelectionUpdate: ({ editor }) => {
            const { from, to } = editor.state.selection
            setSelection({ from, to })
        }
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
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                <EditorContent editor={editor} />
            </div>
        </div>
    )
}
