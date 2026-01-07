
import { useState, useEffect, useRef } from 'react';
import { useAIStore } from '@/store/use-ai-store';
import { Editor } from '@tiptap/react';

/**
 * useContextEngine
 * 
 * The "Mature AI" Engine (Layers 1-5).
 * Replaces the basic useAIAgent loop.
 * 
 * OPTIMIZED: Uses editor instance directly to avoid serializing content
 * on every render/keystroke.
 */
export function useContextEngine(editor: Editor | null, documentId: string | null, isSyncing: boolean) {
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
            fetchCards(documentId).then(() => {
                setIsLoaded(true);

                // Welcome Greeting for New Sessions
                const currentCards = useAIStore.getState().cards;
                if (currentCards.length === 0) {
                    saveCard({
                        id: crypto.randomUUID(),
                        type: 'suggestion',
                        content: "**System Online.**\n\nI am ready to co-author. I will observe your writing and only interrupt when necessary.\n\nYou can also use `[Shadow Prompts]` for manual control.",
                        reason: "System Initialization",
                        timestamp: new Date()
                    }, documentId);
                }
            });
        }
    }, [documentId, fetchCards]);

    const shadowTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Layer 1: Detect Typing Intent via Event Listener
    // This runs outside the render loop!
    useEffect(() => {
        if (!editor) return;

        const handleUpdate = () => {
            // IMEMDIATELY set typing state (Visual feedback protection)
            // But we don't force a React render unless it changed
            if (!isTyping) setIsTyping(true);

            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            if (shadowTimeoutRef.current) clearTimeout(shadowTimeoutRef.current);

            // 3.5s Hard Debounce (Layer 1) - For deep analysis
            typingTimeoutRef.current = setTimeout(() => {
                setIsTyping(false);
                // Trigger analysis check when typing stops
                triggerAnalysis();
            }, 3500);

            // 1.0s Fast Debounce - For Shadow Prompts (User demands speed here)
            shadowTimeoutRef.current = setTimeout(() => {
                const text = editor.getText();
                checkShadowPrompt(text);
            }, 1000);
        };

        editor.on('update', handleUpdate);

        return () => {
            editor.off('update', handleUpdate);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            if (shadowTimeoutRef.current) clearTimeout(shadowTimeoutRef.current);
        };
    }, [editor, isTyping]); // Re-bind if editor changes

    // The Analysis Trigger (Called when idle)
    const triggerAnalysis = () => {
        // Gates:
        // 0. System paused or not loaded
        if (isPaused || !documentId || !isLoaded || !editor) return;

        // 1. Isolation: Never reason while typing (redundant check)
        // if (isTyping) return; // We are called by the timeout clearing typing, so we are safe.

        // Get Content ONLY NOW (Expensive operation deferred until idle)
        const content = editor.getText();

        // 2. Structure: Only wake if meaningful change triggered
        const currentWordCount = content.split(/\s+/).length;
        const diff = Math.abs(currentWordCount - structureRef.current.lastAnalyzedLength);

        // Threshold: ~15 words difference or massive deletion
        // Also initial boot (diff could be 0 but length > 0 if first load)
        const isMeaningfulChange = diff > 15 || (structureRef.current.lastAnalyzedLength === 0 && currentWordCount > 20);

        if (!isMeaningfulChange) return;

        // 4. Cooldown: Minimum 30s between generations
        const now = Date.now();
        const timeSinceLast = now - sessionRef.current.lastGenerationTime;
        if (timeSinceLast < 30000 && sessionRef.current.lastGenerationTime !== 0) {
            return;
        }

        // 5. Budget: Max 3 auto-generations per session (for this demo/hackathon scope)
        if (sessionRef.current.budgetUsed >= 3) {
            setWriterState('idle'); // "Observing"
            return;
        }

        // If gates passed, schedule analysis API call
        // We use a small buffer just to ensure UI is settled
        if (analysisTimeoutRef.current) clearTimeout(analysisTimeoutRef.current);

        analysisTimeoutRef.current = setTimeout(async () => {
            setWriterState('thinking');

            // Update Snapshot
            structureRef.current.lastAnalyzedLength = currentWordCount;

            // Layer 7: Check Shadow Prompt
            await checkShadowPrompt(content);

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
                            content: `I have an idea for ** ${intentData.section} **.${intentData.intent}.Shall I proceed ? `,
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

        }, 100);

    };

    // Layer 7: Shadow Prompting
    const lastShadowPromptRef = useRef<string | null>(null);

    const checkShadowPrompt = async (content: string) => {
        // Regex: Newline (or start), followed by [prompt], optional whitespace
        // Captures the content inside []
        const regex = /(?:^|\n)\[(.*?)\]/g;
        let match;
        let lastMatch = null;

        // Find the *last* shadow prompt in the document
        while ((match = regex.exec(content)) !== null) {
            lastMatch = match;
        }

        if (lastMatch) {
            const promptText = lastMatch[1].trim();

            // Deduplication: If we already processed this exact prompt *recently* (in this session), skip.
            if (promptText && promptText !== lastShadowPromptRef.current) {
                lastShadowPromptRef.current = promptText;

                // Execute Action
                await executeShadowAction(promptText, content);
            }
        }
    };

    const executeShadowAction = async (action: string, context: string) => {
        if (!documentId) return;

        const tempId = crypto.randomUUID();
        // Optimistic UI
        await saveCard({
            id: tempId,
            type: 'action',
            reason: `Shadow Prompt: ${action}`,
            content: 'Thinking...',
            timestamp: new Date(),
            fromDb: false
        }, documentId);

        try {
            const response = await fetch('/api/ai/action', {
                method: 'POST',
                body: JSON.stringify({
                    action,
                    selection: action, // For shadow prompt, the selection IS the action text largely
                    context
                })
            });

            if (!response.ok) throw new Error('Shadow action failed');
            const data = await response.json();

            // Replace with real result
            useAIStore.getState().removeCard(tempId);

            await saveCard({
                id: crypto.randomUUID(),
                type: 'action',
                reason: `Shadow Prompt: ${action}`,
                content: data.content,
                timestamp: new Date()
            }, documentId);

        } catch (error) {
            console.error(error);
            useAIStore.getState().removeCard(tempId);
        }
    };

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

    // Cleanup
    useEffect(() => {
        return () => {
            if (analysisTimeoutRef.current) clearTimeout(analysisTimeoutRef.current);
        };
    }, []);

    return {};
}

