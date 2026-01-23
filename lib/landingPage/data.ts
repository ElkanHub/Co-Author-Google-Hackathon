import { MaturityLayer, TechItem } from '@/lib/landingPage/types';

export const maturityLayers: MaturityLayer[] = [
  { level: 1, name: "Observe", description: "The AI silently watches keystrokes, building context without acting." },
  { level: 2, name: "Wait", description: "Enforces a mandatory cooldown to ensure it doesn't block the writer's flow." },
  { level: 3, name: "Evaluate Intent", description: "Analyzes the text: Is the user stuck? Or just pausing for thought?" },
  { level: 4, name: "Draft Solution", description: "Generates a potential contribution in a hidden buffer." },
  { level: 5, name: "Score Relevance", description: "Is this genuinely useful? If the score is low, discard immediately." },
  { level: 6, name: "Justify Interruption", description: "Calculates the cost of breaking the user's focus." },
  { level: 7, name: "Present", description: "Subtly renders the suggestion in the side margin, never the main text." },
];

export const techStack: TechItem[] = [
  { name: "Next.js", role: "App Router Framework" },
  { name: "Tiptap", role: "Headless Editor" },
  { name: "Zustand", role: "State Management" },
  { name: "Supabase", role: "Persistence & Auth" },
  { name: "Google Gemini 3 Flash", role: "Reasoning & Context" },
  { name: "AudioWorklets", role: "Real-time Voice Playback" },
];