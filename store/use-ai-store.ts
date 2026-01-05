import { create } from 'zustand'

type WriterState = 'idle' | 'thinking' | 'writing'
type VoiceState = 'inactive' | 'active'

interface AIStore {
    writerState: WriterState
    voiceState: VoiceState
    isMuted: boolean

    setWriterState: (state: WriterState) => void
    setVoiceState: (state: VoiceState) => void
    setIsMuted: (isMuted: boolean) => void
    toggleMute: () => void
}

export const useAIStore = create<AIStore>((set) => ({
    writerState: 'idle',
    voiceState: 'inactive',
    isMuted: false,

    setWriterState: (state) => set({ writerState: state }),
    setVoiceState: (state) => set({ voiceState: state }),
    setIsMuted: (isMuted) => set({ isMuted }),
    toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
}))
