import { useState, useEffect, useRef, useCallback } from 'react';
import { useAIStore, AICard } from '@/store/use-ai-store';

/**
 * useContextEngine
 * 
 * The "Mature AI" Engine (Layers 1-5).
 * Replaces the basic useAIAgent loop.
 */
export function useContextEngine(content: string, documentId: string | null, isSyncing: boolean) {
    const { isPaused, setWriterState, cards, saveCard, fetchCards } = useAIStore();
    const [isLoaded, setIsLoaded] = useState(false);

    // Layer 1: Isolation (Typing State)
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Layer 2: Structure Snapshot
    const structureRef = useRef<{
        lastWordCount: number;
        lastAnalyzedLength: number;
    }>({ lastWordCount: 0, lastAnalyzedLength: 0 });

    // Layer 4 & 5: Cooldown & Budget
    const sessionRef = useRef<{
        lastGenerationTime: number;
        budgetUsed: number;
    }>({ lastGenerationTime: 0, budgetUsed: 0 });

    const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Initial Load
    useEffect(() => {
        if (documentId) {
            fetchCards(documentId).then(() => setIsLoaded(true));
        }
    }, [documentId, fetchCards]);

    // Layer 1: Detect Typing Intent
    useEffect(() => {
        setIsTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        // 3.5s Hard Debounce (Layer 1)
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
        }, 3500);

        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [content]);

    // Main Engine Loop
    useEffect(() => {
        // Gates:
        // 0. System paused or not loaded
        if (isPaused || !documentId || !isLoaded) return;

        // 1. Isolation: Never reason while typing
        if (isTyping) {
            setWriterState('idle'); // Ensure we don't look like we're thinking
            return;
        }

        // 2. Structure: Only wake if meaningful change triggered
        const currentWordCount = content.split(/\s+/).length;
        const diff = Math.abs(currentWordCount - structureRef.current.lastAnalyzedLength);

        // Threshold: ~50 words difference or massive deletion
        // Also initial boot
        const isMeaningfulChange = diff > 30 || (structureRef.current.lastAnalyzedLength === 0 && currentWordCount > 50);

        if (!isMeaningfulChange) return;

        // 4. Cooldown: Minimum 60s between generations
        const now = Date.now();
        const timeSinceLast = now - sessionRef.current.lastGenerationTime;
        if (timeSinceLast < 60000 && sessionRef.current.lastGenerationTime !== 0) {
            return;
        }

        // 5. Budget: Max 3 auto-generations per session (for this demo/hackathon scope)
        // Reset budget if user actively interacts? For now, hard limit.
        if (sessionRef.current.budgetUsed >= 3) {
            setWriterState('idle'); // "Observing"
            return;
        }

        // If gates passed, schedule analysis
        if (analysisTimeoutRef.current) clearTimeout(analysisTimeoutRef.current);

        analysisTimeoutRef.current = setTimeout(async () => {
            // Re-check gates just in case
            if (isTyping) return;

            setWriterState('thinking');

            // Update Snapshot
            structureRef.current.lastAnalyzedLength = currentWordCount;

            try {
                // Layer 6: Justification happens in API
                const analyzeRes = await fetch('/api/ai/analyze', {
                    method: 'POST',
                    body: JSON.stringify({
                        text: content,
                        previousSuggestions: cards.slice(0, 3).map(c => c.content)
                    })
                });

                const intentData = await analyzeRes.json();

                // Logic Gate: Justification (Layer 6)
                if (intentData.should_generate) {

                    // Layer 5b: Feedback Protocol
                    if (intentData.feedback_needed) {
                        setWriterState('idle');
                        const feedbackId = crypto.randomUUID();
                        await saveCard({
                            id: feedbackId,
                            type: 'feedback',
                            content: `I have an idea for **${intentData.section}**. ${intentData.intent}. Shall I proceed?`,
                            timestamp: new Date(),
                            actions: [
                                {
                                    label: 'Yes',
                                    onClick: () => {
                                        useAIStore.getState().removeCard(feedbackId);
                                        // Bypass cooldown for explicit yes
                                        generateContent(intentData.intent, intentData.stage, content);
                                    }
                                },
                                {
                                    label: 'No',
                                    variant: 'secondary',
                                    onClick: () => useAIStore.getState().removeCard(feedbackId)
                                }
                            ]
                        }, documentId);

                    } else {
                        // Auto-Generate
                        await generateContent(intentData.intent, intentData.stage, content);

                        // Update Budget & Cooldown
                        sessionRef.current.lastGenerationTime = Date.now();
                        sessionRef.current.budgetUsed += 1;
                    }

                } else {
                    // AI decided to stay silent (Restraint)
                    setWriterState('idle');
                }

            } catch (e) {
                console.error(e);
                setWriterState('idle');
            }

        }, 1000); // Small buffer after typing stops

        return () => {
            if (analysisTimeoutRef.current) clearTimeout(analysisTimeoutRef.current);
        };

    }, [isTyping, content, documentId, isLoaded, isPaused, cards, saveCard, setWriterState]); // Dependencies

    // Helper: Generate Content
    const generateContent = async (intent: string, stage: string, context: string) => {
        if (!documentId) return;
        setWriterState('writing');
        try {
            const genRes = await fetch('/api/ai/generate', {
                method: 'POST',
                body: JSON.stringify({ intent, stage, text: context })
            });
            const cardData = await genRes.json();

            await saveCard({
                id: crypto.randomUUID(),
                type: cardData.type || 'suggestion',
                content: cardData.content,
                reason: cardData.reason,
                timestamp: new Date()
            }, documentId);
        } catch (e) {
            console.error(e);
        } finally {
            setWriterState('idle');
        }
    };

    return {};
}
