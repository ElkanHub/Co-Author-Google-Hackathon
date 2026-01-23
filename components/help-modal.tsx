'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'

interface HelpModalProps {
    isOpen: boolean
    onClose: () => void
}

const TOTAL_SLIDES = 14

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
    const [currentSlide, setCurrentSlide] = useState(1)

    // Reset slide when modal opens
    useEffect(() => {
        if (isOpen) {
            setCurrentSlide(1)
        }
    }, [isOpen])

    const nextSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev === TOTAL_SLIDES ? 1 : prev + 1))
    }, [])

    const prevSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev === 1 ? TOTAL_SLIDES : prev - 1))
    }, [])

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') nextSlide()
            if (e.key === 'ArrowLeft') prevSlide()
            if (e.key === 'Escape') onClose()
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, nextSlide, prevSlide, onClose])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-5xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-zinc-800">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-zinc-800 text-white rounded-full transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Slide Image */}
                <div className="relative w-full h-full">
                    <Image
                        key={currentSlide}
                        src={`/slides/${currentSlide}.jpg`}
                        alt={`Help Slide ${currentSlide}`}
                        fill
                        className="object-contain"
                        priority
                    />
                </div>

                {/* Navigation Buttons - Left */}
                <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-zinc-800 text-white rounded-full backdrop-blur-md transition-all hover:scale-105"
                >
                    <ChevronLeft className="w-8 h-8" />
                </button>

                {/* Navigation Buttons - Right */}
                <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-zinc-800 text-white rounded-full backdrop-blur-md transition-all hover:scale-105"
                >
                    <ChevronRight className="w-8 h-8" />
                </button>

                {/* Page Indicator */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-1 rounded-full text-white text-sm font-medium backdrop-blur-md">
                    {currentSlide} / {TOTAL_SLIDES}
                </div>

            </div>
        </div>
    )
}
