# Co-Author Strategy & Implementation Plan

## 1. Technical Foundation

### Core Stack
- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS v4
- **Editor:** TipTap (Headless, robust, extensible)
- **Database:** Supabase (PostgreSQL + Realtime)
- **AI Core:** Google Gemini 3.0 (Multimodal, Long Context)
- **State Management:** Zustand (Client state), TanStack Query (Server state)

### Why this stack?
- **Speed:** Next.js 16 + Tailwind v4 is the bleeding edge of performance.
- **Context:** Gemini's 1M+ token window allows us to send the *entire* document history on every significant update, enabling "Context is the Prompt."
- **Real-time:** Supabase enables seamless syncing, which is crucial for the "Shadow Doc" concept.

## 2. Architecture & Modules

### A. The Editor (The Eye)
*Component: `UserEditor.tsx`*
- **Description:** A clean, distraction-free writing surface.
- **Tech:** TipTap with custom extensions (Presence, Comments, UniqueID).

Deliver a split-screen research editor where:

The user writes normally

The AI silently understands context

Suggestions appear in a separate, transparent, tagged space

No chat UI

No prompt typing

If this lands, you win attention.

1. Core Scope (What You WILL Build)
A. Main Research Editor (Tiptap)

Keep it clean and serious.

Required Tools

Paragraphs

Headings (H1–H3 only)

Bold, Italic, Underline

TextAlign

FontFamily

FontSize

LineHeight

Indent

Bullet & Numbered lists

Undo / Redo

Word count

Page breaks (manual only)

A4 page preset (fake pagination is fine)

You are signaling research, not recreating Word.

B. AI Writing Space (The Differentiator)

This is non-negotiable.

Features

Read-only editor (same typography as main editor)

Streaming formatted text

Collapsible

Chronological chunks

Each chunk has:

Tag (Suggestions, Outline, Sources)

Trigger reason

“Generated from heading: X”

Copy button

No editing. No chatting.

Judges will feel the discipline.

8. Right-Click / Context Menu (AI Entry Point)

This is the bridge to your AI agent.

Context Actions

Cite

Paraphrase

Summarize

Expand

Analyze

Generate counterarguments

Suggest sources

Define terms

- **Behavior:**
  - Implements a "Shadow Doc" mechanism: `Editor Content -> Debounce (1s) -> Context State`.
  - Captures cursor position and selection to prioritize "Local Context" vs "Global Context" for the AI.

### B. The AI Space (The Brain)
*Component: `IntelligenceFeed.tsx`*
- **Description:** A collateral sidebar, *not* a chat window. It streams "Intelligence Cards." This is not a generic sidebar, it is a part of the Writting space that can collapse fully and expand up to 50% of the screen width maximum. it will have appropriate formating like the text in the editor but it is a read-only space.
- **Mechanism:**
  - **Passive Mode:** Subscribes to the "Context State". When significant changes occur (new heading, pause > 3s), it triggers a background analysis.
  - **Active Mode:** Right-click context menu on text triggers specific "Agents" (Cite, Rewrite, Expand).
- **Data Structure:**
  ```typescript
  type IntelligenceCard = {
    id: string;
    type: 'suggestion' | 'citation' | 'critique' | 'praise';
    trigger: string; // e.g., "User added new heading: 'The Future with AI'"
    content: string; // Markdown
    status: 'streaming' | 'complete';
  }
  ```

### C. The Voice Agent (The Orchestrator)
*Component: `VoiceOrchestrator.tsx`*
- **Description:** A floating, always-on voice interface using Gemini Live (WebSockets).
- **Role:** High-level direction and "rubber ducking."
- **Integration:** 
  - The Voice Agent has tools availability to `read_document_structure`, `generate_idea_card`, and `search_scholar`.
  - It does NOT write directly to the document. It dictates to the AI Space.
  - It acn call the writing agent to do a specific task based on what the user has asked.. like calls the writing agent to generate bullets points on "x", elaborate on "x", generate counter arguments for "x", etc.

### D. The Database (The Memory)
*Supabase Schema:*
- `documents`: Stores the TipTap JSON content.
- `intelligence_streams`: Stores the history of AI suggestions (for training/finetuning later).
- `vectors`: (Optional phase 2) Embeddings for user's past writings to maintain style consistency.

## 3. Implementation Stages

### Stage 1: The Foundation (Speed Run)
- [ ] Initialize Next.js + Tailwind.
- [ ] Setup Supabase client.
- [ ] **Implement Main Research Editor (Tiptap):**
  - [ ] Configure Toolbar: Headings (H1-H3), Styles (Bold/Italic/Underline), Lists (Bullet/Numbered), Align, Indent.
  - [ ] Add Utilities: Word count, Undo/Redo, Page breaks (Manual), A4 preset.
  - [ ] Styling: "Clean and serious" research aesthetic.
- [ ] Create the "Shadow Doc" state management (Zustand).

### Stage 2: The Silent Observer (Context Engine)
- [ ] Build `ContextEngine` which monitors the editor.
- [ ] Implement the "Intent Inference" classifier.
- [ ] **Create the AI Writing Space:**
  - [ ] Split-screen layout (collapsible, max 50% width).
  - [ ] Read-only streaming interface with formatting.
  - [ ] Intelligence Cards with Metadata (Tag, Trigger Reason, Source).
- [ ] Connect Gemini 3.0 API for passive suggestions.
- [ ] **Constraint:** No editing or chatting in this space.

### Stage 3: The Active Collaborator (The Agents)
- [ ] **Implement Right-Click Context Menu:**
  - [ ] Actions: Cite, Paraphrase, Summarize, Expand, Analyze, Counterarguments, Suggest sources, Define terms.
- [ ] Build the specific "Micro-Agents" for each action.
- [ ] Ensure agents output to the AI Space, not the Editor.

### Stage 4: The Voice Layer (Gemini Live)
- [ ] Implement WebSocket connection to Gemini Live.
- [ ] **Tool Integration:**
  - [ ] Give Voice Agent tools to read document structure.
  - [ ] **Delegation:** Enable Voice Agent to call Writing Agents (e.g., "Draft a counter-argument for this section").
- [ ] Create the "Floating Orb" UI.

## 4. "Winning the Hackathon" Tactics

1.  **Zero-Latency Illusion:** Use optimistic UI updates for the Intelligence Cards while Gemini thinks.
2.  **Visual "Thinking":** The Pulse Indicator explained in BUILD_PLAN is critical. It visualizes the AI's attention.
3.  **The "Magic Moment":** The demo must show the user typing a controversial claim, pausing, and the AI *silently* sliding in a card with a citation verifying or debunking it without being asked. That is the winning interaction.
