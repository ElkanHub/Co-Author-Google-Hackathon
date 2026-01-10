'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AIDynamicIsland } from "@/components/ai-dynamic-island";
import { UserEditor } from "@/components/editor/user-editor";
import { AISidebar } from "@/components/ai-sidebar";
import { useAIStore } from "@/store/use-ai-store"; // Import store
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { HomeIcon } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"


export default function EditorPage() {
    const params = useParams()
    const documentId = params?.id as string
    const [title, setTitle] = useState("Autonomous Research")
    const [isEditing, setIsEditing] = useState(false)
    const supabase = createClient()

    // We need access to the editor content for context. 
    // Ideally UserEditor would lift this state up or we access it via context.
    // Assuming useEditorContext is available and provides access.
    // But wait, the context provider is inside UserEditor? No, usually wraps it.
    // Let's assume for now we don't have direct access to the text unless we restructure.
    // FOR PROTOTYPE: We will pass a placeholder or try to read from DOM/State if possible.
    // Actually, let's just use a simple state reference if we can, or modify UserEditor to export it.
    // Better: The `VoiceAgent` needs context. Let's rely on `useEditorContext` if it exists globally?
    // Checking `hooks/use-context-engine.ts`....

    // Let's mock the Handle for now.
    const handleWriteToAiSpace = async (type: string, title: string, content: string) => {
        // Validate type
        const validTypes = ['suggestion', 'analysis', 'citation', 'feedback', 'action'];
        const cardType = validTypes.includes(type.toLowerCase()) ? type.toLowerCase() : 'analysis';

        const newCard = {
            id: crypto.randomUUID(),
            type: cardType as any,
            content: content,
            reason: title, // hijacking intent for title storage for now
            timestamp: new Date(),
            fromDb: false
        };

        try {
            // Use store action for optimistic update + DB save
            await useAIStore.getState().saveCard(newCard, documentId);
            console.log("Wrote to AI Space:", title);
        } catch (e) {
            console.error("Failed to write to AI Space", e);
        }
    }

    useEffect(() => {
        if (!documentId) return

        const fetchTitle = async () => {
            const { data } = await supabase
                .from('documents')
                .select('title')
                .eq('id', documentId)
                .single()

            if (data?.title) {
                setTitle(data.title)
            }
        }
        fetchTitle()
    }, [documentId])

    const handleTitleSave = async () => {
        setIsEditing(false)
        if (!documentId) return

        if (!title.trim()) {
            setTitle("Autonomous Research") // Revert if empty
            return
        }

        await supabase
            .from('documents')
            .update({ title: title })
            .eq('id', documentId)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleTitleSave()
        }
    }

    return (
        <div className="h-screen w-full bg-zinc-50 dark:bg-black overflow-hidden font-sans flex flex-col">
            {/* Main Workspace with Resizable Panels */}
            <ResizablePanelGroup direction="horizontal" className="flex-1 h-full">

                {/* Left Panel: AI Space */}
                <ResizablePanel
                    defaultSize={300}
                    minSize={200}
                    maxSize={450}
                    className="flex flex-col h-full"
                >
                    <AISidebar className="h-full w-full" />
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Right Panel: Editor */}
                <ResizablePanel
                    defaultSize={75}
                    minSize={30}
                    className="flex flex-col h-full bg-zinc-50 dark:bg-black"
                >
                    {/* Header inside the editor panel */}
                    <div className="flex-1 flex flex-col h-full relative">
                        {/* Header */}
                        <header className="relative h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center px-6 justify-between flex-shrink-0">
                            <div className="flex items-center gap-2">
                                {/* back button */}
                                <Link href="/">
                                    <Button variant="ghost" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300">
                                        <HomeIcon className="h-5 w-5" />
                                    </Button>
                                </Link>
                                <span className="font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">Co-Author</span>
                                {isEditing ? (
                                    <input
                                        autoFocus
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        onBlur={handleTitleSave}
                                        onKeyDown={handleKeyDown}
                                        className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium border-none focus:ring-1 focus:ring-indigo-500 outline-none w-[200px]"
                                    />
                                ) : (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-medium hover:text-zinc-900 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors truncate max-w-[200px]"
                                    >
                                        {title}
                                    </button>
                                )}
                            </div>

                            {/* Dynamic Island in Header */}
                            <AIDynamicIsland
                                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                                initialContext={"Title: " + title}
                                onContentGenerated={handleWriteToAiSpace}
                            />

                            <div className="flex items-center gap-4">
                                <ModeToggle />
                            </div>
                        </header>

                        {/* Editor Container */}
                        <main className="flex-1 overflow-hidden p-6 flex justify-center bg-zinc-50 dark:bg-zinc-950/30">
                            <div className="w-full max-w-[850px] h-full shadow-sm">
                                <UserEditor documentId={documentId} />
                            </div>
                        </main>
                    </div>
                </ResizablePanel>

            </ResizablePanelGroup>
        </div>
    );
}
