import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { GripVertical } from 'lucide-react'

export function ResizableImage(props: NodeViewProps) {
    const { node, updateAttributes, selected } = props
    const [width, setWidth] = useState(node.attrs.width)
    const [isResizing, setIsResizing] = useState(false)
    const resizeRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setWidth(node.attrs.width)
    }, [node.attrs.width])

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        setIsResizing(true)

        const startX = e.clientX
        const startWidth = resizeRef.current?.offsetWidth || 0

        const handleMouseMove = (e: MouseEvent) => {
            const currentX = e.clientX
            const diffX = currentX - startX
            // Assuming dragging from right handle
            const newWidth = Math.max(100, startWidth + diffX)

            // Limit to percentage or pixels. Here using pixels implicitly or percentage if string.
            // For simplicity, let's treat width as CSS string or number.
            // If it's a number, it's pixels.

            setWidth(newWidth)
        }

        const handleMouseUp = () => {
            setIsResizing(false)
            updateAttributes({ width: width }) // Sync back to editor
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
    }, [updateAttributes, width])

    // Update attributes when interaction ends
    useEffect(() => {
        if (!isResizing) {
            updateAttributes({ width: width })
        }
    }, [isResizing, updateAttributes, width])


    const align = node.attrs.textAlign || 'center'

    return (
        <NodeViewWrapper className="flex w-full" style={{ justifyContent: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center' }}>
            <div
                ref={resizeRef}
                className={cn(
                    "relative group max-w-full",
                    selected ? "ring-2 ring-blue-500" : ""
                )}
                style={{ width: typeof width === 'number' ? `${width}px` : width }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={node.attrs.src}
                    alt={node.attrs.alt}
                    className="block max-w-full h-auto rounded shadow-sm"
                />

                {/* Resize Handle */}
                <div
                    className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2 w-4 h-8 bg-black/50 rounded flex items-center justify-center cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity",
                        isResizing && "opacity-100"
                    )}
                    onMouseDown={handleMouseDown}
                >
                    <GripVertical className="w-3 h-3 text-white" />
                </div>
            </div>
        </NodeViewWrapper>
    )
}
