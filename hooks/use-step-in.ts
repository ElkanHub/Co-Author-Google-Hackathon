import { useEffect, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { useAIStore } from '@/store/use-ai-store';
import { v4 as uuidv4 } from 'uuid';

export function useStepIn(editor: Editor | null, documentId: string | null) {
    const { setStepInActive, addCard, saveCard, isStepInActive } = useAIStore();

    const handleStepIn = useCallback(async () => {
        if (!editor || isStepInActive) return;

        setStepInActive(true);
        const content = editor.getText();

        try {
            const response = await fetch('/api/ai/step-in', {
                method: 'POST',
                body: JSON.stringify({
                    text: content,
                    stage: 'Step In Mode'
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.missingInstructions) {
                    addCard({
                        id: uuidv4(),
                        type: 'action',
                        reason: 'Step In Error',
                        content: `**No instructions found.** \n\n${errorData.error}`,
                        timestamp: new Date()
                    });
                } else {
                    throw new Error(errorData.error || 'Step In failed');
                }
                return;
            }

            const data = await response.json();

            // 1. Output Plan
            const planCard = {
                id: uuidv4(),
                type: 'action' as const,
                reason: 'Step In: Planning',
                content: data.plan,
                timestamp: new Date()
            };
            if (documentId) await saveCard(planCard, documentId);
            else addCard(planCard);

            // 2. Execute Writing (Update Editor)
            // We want to replace the content but Keep the Instructions heading if possible?
            // Actually, the API returns just the body. Let's find the instruction block and keep it.
            const fullContent = editor.getHTML(); // Use HTML to preserve structure
            // However, the AI returns markdown. Let's just update the editor with the new content.
            // If the user has instructions at the top, we might want to keep them.

            // For now, let's just insert the new content. 
            // In a real app we'd be more surgical.
            editor.commands.setContent(data.execution);

            // 3. Output Evaluation
            const evalCard = {
                id: uuidv4(),
                type: 'analysis' as const,
                reason: `Step In: Evaluation (Score: ${data.evaluation.score})`,
                content: `**Alignment:** ${data.evaluation.alignment}\n\n**Critique:** ${data.evaluation.critique}`,
                timestamp: new Date()
            };
            if (documentId) await saveCard(evalCard, documentId);
            else addCard(evalCard);

            // 4. Final Explanation
            const explanationCard = {
                id: uuidv4(),
                type: 'suggestion' as const,
                reason: 'Step In: Final Explanation',
                content: data.explanation,
                timestamp: new Date()
            };
            if (documentId) await saveCard(explanationCard, documentId);
            else addCard(explanationCard);

        } catch (error: any) {
            console.error('Step In Error:', error);
            addCard({
                id: uuidv4(),
                type: 'analysis',
                reason: 'Step In Failure',
                content: `An error occurred during Step In: ${error.message}`,
                timestamp: new Date()
            });
        } finally {
            setStepInActive(false);
        }
    }, [editor, isStepInActive, documentId, setStepInActive, addCard, saveCard]);

    useEffect(() => {
        const listener = () => handleStepIn();
        window.addEventListener('trigger-step-in', listener);
        return () => window.removeEventListener('trigger-step-in', listener);
    }, [handleStepIn]);
}
