import { useState, useEffect, useRef } from 'react';
import { useAIStore, AICard } from '@/store/use-ai-store';

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
    const { isPaused, setWriterState, cards, saveCard, fetchCards } = useAIStore();
    const [analysis, setAnalysis] = useState<any>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Load History on Mount
    useEffect(() => {
        if (documentId) {
            setIsLoaded(false);
            fetchCards(documentId).then(() => {
                setIsLoaded(true);
            });
        }
    }, [documentId, fetchCards]);

    // Helper to perform the actual generation
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

    // Session Greeting (Only on fresh, empty sessions)
    useEffect(() => {
        if (isLoaded && documentId && cards.length === 0) {
            // Only greet if text is also empty?? User said "blank sheet"
            // But content might take a split second to sync. 
            // Let's assume if cards are empty, we can greet.
            saveCard({
                id: crypto.randomUUID(),
                type: 'suggestion',
                content: "Hello! I'm your AI co-author. I'm ready to research and write by your side. Start typing, and I'll jump in with suggestions.",
                timestamp: new Date()
            }, documentId);
        }
    }, [isLoaded, documentId, cards.length, saveCard]);

    useEffect(() => {
        if (isPaused || !documentId || !content || content.length < 50) return;

        // BLOCKER: If the last card was a feedback request, wait for user response.
        if (cards.length > 0 && cards[0].type === 'feedback') {
            return;
        }

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(async () => {
            setWriterState('thinking');
            try {
                // Prepare context with previous suggestions
                const previousSuggestions = cards.slice(0, 3).map(c => c.content);

                const analyzeRes = await fetch('/api/ai/analyze', {
                    method: 'POST',
                    body: JSON.stringify({ text: content, previousSuggestions })
                });
                const intentData = await analyzeRes.json();
                setAnalysis(intentData);

                // Logic Gate
                if (intentData.feedback_needed) {
                    setWriterState('idle');

                    const feedbackId = crypto.randomUUID()

                    // Ask user for permission (Persist this too)
                    await saveCard({
                        id: feedbackId,
                        type: 'feedback',
                        content: `I realized you are working on the **${intentData.section}**. ${intentData.intent}. Should I generate some content for this?`,
                        timestamp: new Date(),
                        actions: [
                            {
                                label: 'Yes, please',
                                onClick: () => {
                                    // Remove the feedback card then generate
                                    // removeCard(feedbackId) // Optional: keep it as history? User said "if yes it goes on to general". 
                                    // Usually better to keep the question in history or replace it. 
                                    // Let's keep it but maybe mark it resolved? 
                                    // For simplicity: We just generate. The old feedback card flows down.
                                    // Limitation: It will still be Type=Feedback, so it might Block again?
                                    // FIX: We must REMOVE or UPDATE the feedback card to not be the top one?
                                    // Or just Rely on the new card being added on top.
                                    // "Yes" -> Generate -> New Card added on top -> Block cleared?
                                    // YES. New card is type 'suggestion'. Block cleared.
                                    generateContent(intentData.intent, intentData.stage, content)
                                }
                            },
                            {
                                label: 'No, thanks',
                                variant: 'secondary',
                                onClick: () => {
                                    // Dismiss: Remove the card so we stop blocking
                                    // removeCard is needed here.
                                    useAIStore.getState().removeCard(feedbackId)
                                }
                            }
                        ]
                    }, documentId);
                } else if (intentData.confidence > 0.7 && intentData.should_generate) {
                    // Auto-generate
                    await generateContent(intentData.intent, intentData.stage, content);
                } else {
                    setWriterState('idle');
                }

            } catch (err) {
                console.error('AI Loop Error:', err);
                setWriterState('idle');
            }
        }, 4000);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };

    }, [content, isPaused, documentId, setWriterState, cards, saveCard]);

    return { currentAnalysis: analysis };
}
