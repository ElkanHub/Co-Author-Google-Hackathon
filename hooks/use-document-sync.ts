import { useState, useEffect, useCallback, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { createClient } from '@/lib/supabase/client';
import { v4 as uuidv4 } from 'uuid';

/**
 * useDocumentSync
 * 
 * This hook acts as the "Context Ingestion" layer.
 * It watches the editor, debounces updates, and saves the content to Supabase.
 * It essentially maintains a "Shadow Doc" that the AI allows reads from.
 */
export function useDocumentSync(editor: Editor | null, documentId: string | null) {
    const [syncedAt, setSyncedAt] = useState<Date | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // We'll use a local ID if one isn't provided, to ensure we have a session ID
    const [localDocId, setLocalDocId] = useState<string | null>(null);

    const supabase = createClient();

    useEffect(() => {
        if (!documentId && !localDocId) {
            const newId = uuidv4();
            setLocalDocId(newId);
            console.log('Created new local document ID:', newId);
        }
    }, [documentId, localDocId]);

    const activeId = documentId || localDocId;

    // Fetch Content on Load
    useEffect(() => {
        if (!activeId || !editor || editor.getText().length > 0) return;

        const fetchContent = async () => {
            const { data, error } = await supabase
                .from('documents')
                .select('content')
                .eq('id', activeId)
                .single();

            if (data?.content) {
                console.log('Restoring document content...');
                // queueMicrotask to ensure editor is ready? 
                // Tiptap handles this well usually.
                try {
                    editor.commands.setContent(data.content);
                } catch (e) {
                    console.error("Failed to set content", e);
                }
            }
        };

        fetchContent();
    }, [activeId, editor, supabase]);

    // Function to perform the actual upsert
    const syncToSupabase = useCallback(async (content: any, plainText: string) => {
        if (!activeId) return;

        setIsSyncing(true);
        try {
            const { error } = await supabase
                .from('documents')
                .upsert(
                    {
                        id: activeId,
                        content,
                        plain_text: plainText,
                        last_active_at: new Date().toISOString()
                    },
                    { onConflict: 'id' }
                );

            if (error) {
                throw error;
            }

            setSyncedAt(new Date());
            setError(null);
        } catch (err: any) {
            console.error('Failed to sync document:', err);
            setError(err.message);
        } finally {
            setIsSyncing(false);
        }
    }, [activeId, supabase]);

    // Debounced listener
    useEffect(() => {
        if (!editor) return;

        const handleUpdate = () => {
            // We debounce manually here or use a library. 
            // For simplicity in this hook, let's use a timeout refs or just rely on the parent to pass debounced content??
            // Actually best practice: Listen to 'update' event and debounce the SAVE call.
        };

        // However, Tiptap has onUpdate. 
        // Let's attach a listener that debounces.

        let debounceTimer: NodeJS.Timeout;

        const onUpdate = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                syncToSupabase(editor.getJSON(), editor.getText());
            }, 2000); // 2 second debounce as per plan
        };

        editor.on('update', onUpdate);

        return () => {
            editor.off('update', onUpdate);
            clearTimeout(debounceTimer);
        };
    }, [editor, syncToSupabase]);

    return {
        isSyncing,
        syncedAt,
        error,
        activeId
    };
}
