import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'

type WriterState = 'idle' | 'thinking' | 'writing'
type VoiceState = 'inactive' | 'active'

export interface AICard {
    id: string
    type: 'suggestion' | 'analysis' | 'citation' | 'feedback' | 'action'
    content: string
    reason?: string
    timestamp: Date
    fromDb?: boolean
    actions?: {
        label: string
        onClick: () => void
        variant?: 'primary' | 'secondary'
    }[]
}

interface AIStore {
    writerState: WriterState
    voiceState: VoiceState
    isMuted: boolean
    isPaused: boolean
    isStepInActive: boolean
    cards: AICard[]

    setWriterState: (state: WriterState) => void
    setVoiceState: (state: VoiceState) => void
    setIsMuted: (isMuted: boolean) => void
    toggleMute: () => void
    setIsPaused: (isPaused: boolean) => void
    togglePause: () => void
    setStepInActive: (active: boolean) => void
    addCard: (card: AICard) => void
    removeCard: (id: string) => void
    clearCards: () => void

    // Async Actions
    fetchCards: (documentId: string) => Promise<void>
    saveCard: (card: AICard, documentId: string) => Promise<void>
    deleteCard: (id: string) => Promise<void>
}

export const useAIStore = create<AIStore>((set, get) => ({
    writerState: 'idle',
    voiceState: 'inactive',
    isMuted: false,
    isPaused: false,
    isStepInActive: false,
    cards: [],

    setWriterState: (state) => set({ writerState: state }),
    setVoiceState: (state) => set({ voiceState: state }),
    setIsMuted: (isMuted) => set({ isMuted }),
    toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
    setIsPaused: (isPaused) => set({ isPaused }),
    togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
    setStepInActive: (active) => set({ isStepInActive: active }),
    addCard: (card) => set((state) => ({ cards: [card, ...state.cards] })),
    removeCard: (id: string) => set((state) => ({ cards: state.cards.filter(c => c.id !== id) })),
    clearCards: () => set({ cards: [] }),

    fetchCards: async (documentId: string) => {
        const supabase = createClient()
        const { data } = await supabase
            .from('ai_generations')
            .select('*')
            .eq('document_id', documentId)
            .order('created_at', { ascending: false })

        if (data && data.length > 0) {
            const loadedCards: AICard[] = data.map((d: any) => {
                let type = d.type;
                // Workaround: Map 'analysis' back to 'action' if reason indicates it
                if (type === 'analysis' && (d.reason?.startsWith('Action:') || d.reason?.startsWith('Shadow Prompt:'))) {
                    type = 'action';
                }

                return {
                    id: d.id,
                    type: type as any,
                    content: d.content,
                    reason: d.reason,
                    timestamp: new Date(d.created_at),
                    fromDb: true
                };
            })
            set({ cards: loadedCards })
        }
    },

    saveCard: async (card: AICard, documentId: string) => {
        const supabase = createClient()
        // Optimistic update
        set((state) => ({ cards: [card, ...state.cards] }))

        // Workaround: Database might not support 'action' type yet. Map to 'analysis'.
        let dbType = card.type;
        if (dbType === 'action') {
            dbType = 'analysis';
        }

        await supabase.from('ai_generations').insert({
            id: card.id,
            document_id: documentId,
            type: dbType,
            content: card.content,
            reason: card.reason,
            created_at: card.timestamp.toISOString()
        })
    },

    deleteCard: async (id: string) => {
        const supabase = createClient()
        // Optimistic update
        set((state) => ({ cards: state.cards.filter(c => c.id !== id) }))

        await supabase
            .from('ai_generations')
            .delete()
            .eq('id', id)
    }
}))
