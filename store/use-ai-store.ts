import { create } from 'zustand'

type WriterState = 'idle' | 'thinking' | 'writing'
type VoiceState = 'inactive' | 'active'

export interface AICard {
    id: string
    type: 'suggestion' | 'analysis' | 'citation' | 'feedback'
    content: string
    reason?: string
    timestamp: Date
}

interface AIStore {
    writerState: WriterState
    voiceState: VoiceState
    isMuted: boolean
    isPaused: boolean
    cards: AICard[]

    setWriterState: (state: WriterState) => void
    setVoiceState: (state: VoiceState) => void
    setIsMuted: (isMuted: boolean) => void
    toggleMute: () => void
    setIsPaused: (isPaused: boolean) => void
    togglePause: () => void
    addCard: (card: AICard) => void
    clearCards: () => void
}

export const useAIStore = create<AIStore>((set) => ({
    writerState: 'idle',
    voiceState: 'inactive',
    isMuted: false,
    isPaused: false,
    cards: [],

    setWriterState: (state) => set({ writerState: state }),
    setVoiceState: (state) => set({ voiceState: state }),
    setIsMuted: (isMuted) => set({ isMuted }),
    toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
    setIsPaused: (isPaused) => set({ isPaused }),
    togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
    addCard: (card) => set((state) => ({ cards: [card, ...state.cards] })),
    clearCards: () => set({ cards: [] }),
}))
