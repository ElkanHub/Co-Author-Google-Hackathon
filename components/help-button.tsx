'use client'

import { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HelpModal } from '@/components/help-modal'
import { cn } from '@/lib/utils'

interface HelpButtonProps {
    className?: string
}

export function HelpButton({ className }: HelpButtonProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(true)}
                className={cn("text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300", className)}
                title="Help & Guide"
            >
                <HelpCircle className="w-5 h-5" />
            </Button>

            <HelpModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    )
}
