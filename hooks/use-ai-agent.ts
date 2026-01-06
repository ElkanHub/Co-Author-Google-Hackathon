import { useState, useEffect, useRef } from 'react';
import { useAIStore } from '@/store/use-ai-store';

/**
 * useAIAgent
 * 
 * The main "Autonomy Loop".
 * 
 * @param content - Text content to analyze
 * @param documentId - ID of current document
 * @param isSyncing - Wait for sync before analyzing
 */
export function useAIAgent(content: string, documentId: string | null, isSyncing: boolean) {
    const { isPaused, setWriterState } = useAIStore();
    const [analysis, setAnalysis] = useState<any>(null);

    // We use a separate debounce for AI than DB
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Session Greeting
    useEffect(() => {
        if (documentId) {
            const hasCards = useAIStore.getState().cards.length > 0;
            if (!hasCards) {
                useAIStore.getState().addCard({
                    id: crypto.randomUUID(),
                    type: 'suggestion',
                    content: "Hello! I'm your AI co-author. I'm ready to research and write by your side. Start typing, and I'll jump in with suggestions.",
                    timestamp: new Date()
                });
            }
        }
    }, [documentId]);

    useEffect(() => {
        // If paused, do absolutely nothing. The AI is asleep.
        if (isPaused || !documentId || !content || content.length < 50) {
            return;
        }

        // Debounce: Wait 4 seconds of inactivity before analyzing
        // This prevents spamming the AI while user is furiously typing
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(async () => {
            // 1. Analyze Intent
            setWriterState('thinking');
            try {
                const analyzeRes = await fetch('/api/ai/analyze', {
                    method: 'POST',
                    body: JSON.stringify({ text: content })
                });
                const intentData = await analyzeRes.json();
                setAnalysis(intentData);

                console.log('AI Intent:', intentData);

                // 2. Decide if we should generate
                // Simple rule for now: If confidence > 0.7, generate a card
                if (intentData.confidence > 0.7) {
                    setWriterState('writing');
                    const genRes = await fetch('/api/ai/generate', {
                        method: 'POST',
                        body: JSON.stringify({
                            intent: intentData.intent,
                            stage: intentData.stage,
                            text: content
                        })
                    });
                    const cardData = await genRes.json();

                    console.log('AI Generated Card:', cardData);

                    // Push to Store
                    useAIStore.getState().addCard({
                        id: crypto.randomUUID(),
                        type: cardData.type || 'suggestion',
                        content: cardData.content,
                        reason: cardData.reason,
                        timestamp: new Date()
                    });

                    setWriterState('idle'); // Done
                } else {
                    setWriterState('idle'); // Intent not strong enough
                }

            } catch (err) {
                console.error('AI Loop Error:', err);
                setWriterState('idle');
            }
        }, 4000);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };

    }, [content, isPaused, documentId, setWriterState]); // Re-run when content changes

    return {
        currentAnalysis: analysis
    };
}
