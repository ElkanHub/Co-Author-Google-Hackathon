# Co-Author Application Documentation

## Overview
Co-Author is an advanced AI-powered writing assistant designed to act as a "disciplined colleague." Unlike standard AI tools that spam suggestions, Co-Author uses a **7-Layer Maturity Stack** to observe, wait, and only intervene when it has a high-value contribution. It features a real-time collaborative editor (Tiptap), a dedicated AI research space, and a robust security layer.

## core Technology Stack
- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, Lucide Icons.
- **Editor**: Tiptap (Headless, Extensible), Markdown support.
- **AI**: Google Gemini 3 Flash Preview (via Google Generative AI SDK).
- **Backend/DB**: Supabase (PostgreSQL) for document storage and vector history.
- **State Management**: Zustand (Global Store).

## Key Features

### 1. The Mature AI Engine (7-Layer Stack)
The core intelligence of the application runs on a sophisticated decision funnel:
1.  **Layer 1: Keystroke Isolation (3.5s)** - The AI is blind while you type. It only "wakes up" 3.5 seconds after your last keystroke.
2.  **Layer 2: Structural Change Detection** - Ignores minor edits. Only analyzes if ~30 words have changed or a major section is completed.
3.  **Layer 3: Local Intent Extraction** - Determines if the user is in "Drafting", "Polishing", or "Researching" mode.
4.  **Layer 4: Contribution Cooldown (60s)** - Enforced silence. The AI defaults to a 1-minute cooldown between unsolicited suggestions.
5.  **Layer 5: Contribution Budgeting** - Limits proactive interruptions to 3 per session to prevent noise. Includes a **Feedback Protocol** (`Yes/No` cards) for high-stakes interventions.
6.  **Layer 6: Interruption Justification** - The AI must internally justify *why* it is interrupting. "Silence is Intelligence."
7.  **Layer 7: Shadow Prompting** - Users can type `[prompt]` on a new line. The AI detects this pattern instantly (1s debounce) and executes the command as an Action Card.

### 2. Security & Safety Layer (`lib/security.ts`)
- **Input Sanitization**: Trims and limits inputs to 100k characters to prevent DoS attacks.
- **Malicious Intent Scanning**: actively scans for jailbreak patterns (e.g., "ignore previous instructions") and blocks them with a 400 error.
- **Route Protection**: integrated into `/api/ai/analyze`, `/api/ai/generate`, and `/api/ai/action`.

### 3. Editor Experience
- **Notion-style Interface**: Clean, minimalist writing environment.
- **Context Menu**: Custom right-click menu with standard tools (Copy, Cut, Paste) and a nested **AI Actions** menu (Cite, Paraphrase, Expand, etc.).
- **Session Renaming**: Click the header title to rename your research session instantly.
- **Performance**: Optimized engine uses event listeners instead of render loops for zero-latency typing.

### 4. AI Research Space (Sidebar)
- **Active Cards**: Displays AI suggestions, actions, and feedback requests.
- **Persistence**: Cards are synced to Supabase and persist across reloads.
- **Filtering**: Filter capabilities for "All", "Action", "Suggestion", "Citation", etc.

## Architecture

### Directory Structure
```
/app
  /api          # Next.js API Routes (AI endpoints)
  /editor       # Editor Page & Logic
/components
  /editor       # Tiptap components (UserEditor, Toolbar, ContextMenu)
  /ai-sidebar   # AI Card stream
/hooks
  use-context-engine.ts  # The brain (Layers 1-5, 7)
  use-document-sync.ts   # Supabase synchronization
/lib
  /ai           # Gemini SDK setup
  security.ts   # Security validation logic
/store
  use-ai-store.ts      # AI State & Card management
  use-editor-store.ts  # Editor State
```

## Security Protocols
All user inputs flowing to the AI are passed through `validateRequest(text)`.
- **Sanitization**: Removes null bytes, trims whitespace.
- **Intent Check**: Rejects known adversarial patterns.

## Getting Started
1. `npm install`
2. Set `GEMINI_API_KEY` and `NEXT_PUBLIC_SUPABASE_URL/KEY` in `.env`.
3. `npm run dev`
