'use client'

import { useState, useEffect } from 'react'

interface TypewriterProps {
    text: string
    speed?: number
    onComplete?: () => void
}

export function Typewriter({ text, speed = 15, onComplete }: TypewriterProps) {
    const [displayedText, setDisplayedText] = useState('')

    useEffect(() => {
        let i = 0
        setDisplayedText('') // Reset on new text

        const interval = setInterval(() => {
            if (i < text.length) {
                setDisplayedText((prev) => prev + text.charAt(i))
                i++
            } else {
                clearInterval(interval)
                if (onComplete) onComplete()
            }
        }, speed)

        return () => clearInterval(interval)
    }, [text, speed, onComplete])

    return <span>{displayedText}</span>
}
