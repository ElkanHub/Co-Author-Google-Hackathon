//resizable.tsx
"use client"

import { GripVertical } from "lucide-react"
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels"

import { cn } from "@/lib/utils"

const ResizablePanelGroup = ({
    className,
    ...props
}: React.ComponentProps<any>) => (
    // @ts-ignore - Types are broken in this install
    <PanelGroup
        className={cn(
            "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
            className
        )}
        {...props}
    />
)

const ResizablePanel = Panel as any

const ResizableHandle = ({
    withHandle,
    className,
    ...props
}: React.ComponentProps<any> & {
    withHandle?: boolean
}) => (
    // @ts-ignore - Types are broken in this install
    <PanelResizeHandle
        className={cn(
            "relative flex w-2 items-center justify-center bg-transparent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-2 data-[panel-group-direction=vertical]:w-full [&[data-panel-group-direction=vertical]>div]:rotate-90",
            className
        )}
        {...props}
    >
        {/* Visible Line */}
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-zinc-200 dark:bg-zinc-800" />

        {withHandle && (
            <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border border-zinc-200 bg-zinc-950/50 dark:border-zinc-800">
                <GripVertical className="h-2.5 w-2.5" />
            </div>
        )}
    </PanelResizeHandle>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
