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
import { useAIAgent } from '@/hooks/use-ai-agent';
import { useDocumentSync } from '@/hooks/use-document-sync';
import { useState, useCallback, useEffect } from 'react'
import { EditorContextMenu } from './editor-context-menu'
import { useAIStore } from '@/store/use-ai-store'
import { v4 as uuidv4 } from 'uuid'

interface UserEditorProps {
    documentId?: string | null;
}

export function UserEditor({ documentId }: UserEditorProps) {
    const { setContent, setSelection, setActiveHeading } = useEditorStore()
    const { addCard } = useAIStore()

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null)

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

    // 1. Sync to Supabase
    const { isSyncing } = useDocumentSync(editor, documentId || null);

    // 2. AI Autonomy Loop
    // We pass the plain text and sync status
    useAIAgent(editor?.getText() || '', documentId || null, isSyncing);

    // Cleanup
    useEffect(() => {
        return () => {
            editor?.destroy()
        }
    }, [editor])

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        // Only show if there is a selection? Or allow empty selection (whole doc)?
        // For now, let's allow it, but maybe check if selection is empty in handler

        // Disable default browser context menu
        setContextMenu({ x: e.clientX, y: e.clientY })
    }, [])

    const handleAIAction = async (action: string) => {
        if (!editor) return

        const { from, to, empty } = editor.state.selection
        const selectionText = editor.state.doc.textBetween(from, to, ' ')

        // Get some surrounding context if selection is small, or just whole doc
        // For simplicity, let's grab the paragraph
        const context = editor.getText() // simplified, sending full text might be too much for long docs, but ok for now

        if (empty && !selectionText) {
            // Maybe notify user?
            console.log("Empty selection")
        }

        // Optimistically add a "Thinking..." card?
        // Or just let the user wait. A toast or loading indicator would be nice.
        // For now, let's just do the request.

        // But better UX: Add a "Writing" card placeholder? 
        // Let's just create the thinking card immediately
        const tempId = uuidv4()
        addCard({
            id: tempId,
            type: 'analysis', // placeholder
            content: 'Thinking...',
            timestamp: new Date(),
            fromDb: false
        })

        try {
            const response = await fetch('/api/ai/action', {
                method: 'POST',
                body: JSON.stringify({
                    action,
                    selection: selectionText,
                    context: context
                })
            })

            if (!response.ok) throw new Error('Action failed')

            const data = await response.json()

            // Replace/Update the card (actually we just add a new one or we could update)
            // our store doesn't have updateCard yet easily exposed except by ID, but we have remove
            // Let's just remove the temp one and add real one
            useAIStore.getState().removeCard(tempId)

            addCard({
                id: uuidv4(),
                type: data.type,
                reason: data.reason,
                content: data.content,
                timestamp: new Date(),
                fromDb: false
            })

        } catch (error) {
            console.error(error)
            useAIStore.getState().removeCard(tempId)
        }
    }

    if (!editor) {
        return null
    }

    return (
        <div className="w-full flex flex-col h-full bg-white dark:bg-zinc-950 shadow-sm border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
            <EditorToolbar editor={editor} />
            <div
                className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800 relative"
                onContextMenu={handleContextMenu}
            >
                <EditorContent editor={editor} />

                {contextMenu && (
                    <EditorContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        onClose={() => setContextMenu(null)}
                        onAction={handleAIAction}
                    />
                )}
            </div>
            {/* Character Count Footer */}
            <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 flex justify-end gap-4 bg-white dark:bg-zinc-950">
                <span>{editor.storage.characterCount.words()} words</span>
                <span>{editor.storage.characterCount.characters()} characters</span>
            </div>
        </div>
    )
}
