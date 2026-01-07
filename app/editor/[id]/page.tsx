'use client'

import { useParams } from 'next/navigation'
import { AIDynamicIsland } from "@/components/ai-dynamic-island";
import { UserEditor } from "@/components/editor/user-editor";
import { AISidebar } from "@/components/ai-sidebar";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"

export default function EditorPage() {
    const params = useParams()
    const documentId = params?.id as string

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
                                <span className="font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">Co-Author</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-medium">Autonomous Research</span>
                            </div>

                            {/* Dynamic Island in Header */}
                            <AIDynamicIsland className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />

                            <div className="flex items-center gap-4">
                                {/* Future tools */}
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
