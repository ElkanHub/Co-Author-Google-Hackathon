import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useState, useEffect } from 'react'

interface TypewriterProps {
    text: string
    speed?: number
    onComplete?: () => void
}

export function Typewriter({ text, speed = 10, onComplete }: TypewriterProps) {
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

    return (
        <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {displayedText}
            </ReactMarkdown>
        </div>
    )
}
