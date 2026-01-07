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

## 2. Core Philosophy: The Mature AI (The 6-Layer Stack)

**Decision to Merge:** We are integrating the "6-Layer Maturity Stack" to fundamentally shift the AI's behavior from "Reactive Chatbot" to "Disciplined Colleague." Most AI tools are insecure—they interrupt constantly to prove they are working. Our goal is **Restraint**. Silence is intelligence. The AI should only speak when it has something valuable to say.

### The Core Principle
**The AI should react to semantic change, not keystrokes.**

### The 6-Layer Maturity Stack
We do not solve this with a single debounce. We solve it with layers of restraint.

#### LAYER 1: Keystroke Isolation (Basic Hygiene)
- **Rule:** Never let the AI reason while keystrokes are active.
- **Implementation:**
  - `isTyping = true` on input.
  - `isTyping = false` only after **2.5–4 seconds** of idle time.

#### LAYER 2: Structural Change Detection (Critical)
- **Rule:** Only wake the AI for meaning, not typos.
- **Triggers:**
  - New heading added.
  - Heading text changed.
  - Section length crosses threshold (>150 words).
  - Paragraph break after a heading.
  - Citation marker appears.
- **Mechanism:** Maintain a `StructureSnapshot` { headings, wordCounts, lastEditedSection }. Only trigger if this snapshot changes.

#### LAYER 3: Intent Stability Gate (The Hesitation)
- **Rule:** Intent must be stable before action. Mimic human hesitation.
- **Implementation:**
  - If Intent = "Outlining", it must remain "Outlining" for **8–15 seconds** with Confidence > 0.75.
  - If intent flips or confidence drops, do nothing.

#### LAYER 4: Contribution Cooldown (Professional Etiquette)
- **Rule:** Do not interrupt repeatedly.
- **Implementation:**
  - Track `lastContributionTime` per section.
  - Minimum **30–60 seconds** between AI contributions per section.
  - New contributions only if a *new* strong signal appears.

#### LAYER 5: Contribution Budgeting (Economy)
- **Rule:** Limit output volume.
- **Budget:**
  - Per section: **1 suggestion batch + 1 source batch**.
  - No more unless intent requires it.
- **The Feedback Protocol (The Handshake):**
  - If the AI has a high-value idea that exceeds the budget or is high-risk (e.g., long-form generation), it must **NOT** generate it immediately.
  - Instead, it generates a **Proposal Card** (Type: `feedback`) asking for consent ("Shall I draft a counter-argument?").
  - **Yes** -> Executes Action. **No** -> Learns & stays silent.
- **Status:** If budget exhausted, Status = "Observing" (communicates restraint).

#### LAYER 6: Interruption Justification (Final Gate)
- **Rule:** The AI must justify its interruption internally.
- **Prompt:** "Why is this worth interrupting the user right now?"
  - Valid: "Claim made without citation", "New section with no outline".
  - Invalid: "General feedback", "Just checking in".
- **Outcome:** If justification is vague, abort.

### The Master Flow
1. User types -> 2. Idle detected -> 3. Structural change? -> 4. Intent stable? -> 5. Cooldown passed? -> 6. Budget available? -> 7. Justification valid? -> **Generate (once)**.

---

## 3. Architecture & Modules

### A. The Editor (The Eye)
*Component: `UserEditor.tsx`*
- **Description:** A clean, distraction-free writing surface.
- **Tech:** TipTap with custom extensions.
- **Role:** The source of truth. It feeds the **Structure Snapshot** to Layer 2.

### B. The AI Space (The Brain)
*Component: `AISidebar.tsx`*
- **Description:** A collateral sidebar, *not* a chat window.
- **Mechanism:**
  - **Passive Mode:** Subscribes to the "Context State". Implements the **6-Layer Stack** to decide *when* to push a card.
  - **Active Mode:** Right-click context menu bypasses layers 1-4 (user explicitly asked).
- **Data Structure:** Returns structured JSON (`AICard`) with `type`, `reason` (for justification), and `content`.

### C. The Voice Agent (The Orchestrator)
- **Description:** Floating, always-on voice interface.
- **Role:** High-level direction. Can act as a user proxy to bypass Layer 5 (Budgeting) if the user verbally requests help.

### D. The Database (The Memory)
*Supabase Schema:*
- `documents`: Stores content.
- `intelligence_streams`: Stores AI suggestions.

## 4. Implementation Stages

### Stage 1: The Foundation (Speed Run)
- [x] Initialize Next.js + Tailwind.
- [x] Setup Supabase client.
- [x] **Implement Main Research Editor (Tiptap):** Basic editor with custom styling.
- [x] Create the "Shadow Doc" state management.

### Stage 2: The Mature Observer (Context Engine)
- [ ] **Implement Layer 1 & 2:** Build `StructureObserver` to track headings and word counts.
- [ ] **Implement Layer 3:** Build `IntentClassifier` with stability buffers.
- [ ] **Create the AI Writing Space:**
  - [x] Sidebar UI (Collapsible).
  - [x] Search & Filtering.
- [ ] **Connect Gemini 3.0:**
  - [ ] Implement Layer 6 (Justification) in the prompt.

### Stage 3: The Active Collaborator (The Agents)
- [x] **Implement Right-Click Context Menu:**
  - [x] Standard Actions (Copy/Paste).
  - [x] AI Submenu (Cite, Paraphrase, etc.).
  - [x] Smart Viewport Adaptation.
- [ ] Build specific "Micro-Agents" for each action.

## 5. "Winning the Hackathon" Tactics
1.  **Status Messaging:** Display "Observing" instead of "Idle" to prove the AI is active but disciplined.
2.  **Batch Generations:** 1 composed response per trigger triggers, reducing noise.
3.  **The "Magic Moment":** The user types a claim, waits. The AI observes (Layer 1-3), determines it needs a citation (Layer 6), and *silently* slides a citation card into the sidebar.
