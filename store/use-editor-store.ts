/**
 * @file use-editor-store.ts
 * @description Global state for the "Shadow Document" and Context synchronization.
 * This is the brain that bridges the Editor and the AI.
 */

import { create } from 'zustand'

interface EditorState {
    // The raw text content of the document (The Shadow Doc)
    content: string
    // Current cursor position (for local context awareness)
    selection: { from: number; to: number }
    // Metadata about the current section context
    activeHeading: string | null

    // Actions
    setContent: (content: string) => void
    setSelection: (selection: { from: number; to: number }) => void
    setActiveHeading: (heading: string | null) => void
}

export const useEditorStore = create<EditorState>((set) => ({
    content: '',
    selection: { from: 0, to: 0 },
    activeHeading: null,

    setContent: (content) => set({ content }),
    setSelection: (selection) => set({ selection }),
    setActiveHeading: (activeHeading) => set({ activeHeading }),
}))
