What i am  building is not a “research assistant”—it is a context-aware co-author. That framing matters because it guides every technical and UX decision.

I’ll break this down cleanly and brutally into:

Core product philosophy

System architecture (how it actually works)

AI behavior & autonomy logic

UI/UX mechanics (editor, AI space, tags, status)

Voice agent orchestration

What judges will actually care about

1. Core Philosophy (This Is the North Star)

Your system has one radical principle:

The user never needs to prompt. Context is the prompt.

This alone separates your project from 90% of “AI writing tools.”

The AI is observational, inferential, and assistive, not reactive.
It watches writing evolve, infers intent, and contributes without interrupting.

This is the difference between:

❌ ChatGPT pasted into an editor

✅ An autonomous research colleague sitting beside you

Keep repeating this to yourself as you build.

2. High-Level System Architecture
A. Context Ingestion Layer (Real-Time)

Forget vision models. Text access is cleaner, faster, cheaper, and more accurate.

You should:

Capture editor state changes (on debounce, e.g. every 500–1000ms)

Track:

Headings

Paragraph boundaries

Citations present/missing

Rewrites and deletions (important for intent drift)

This feeds into a rolling context buffer:

User’s document (primary)

AI-generated suggestions (secondary)

User selections + actions (signals)

Your 1M context window advantage shines here. You’re not summarizing aggressively—you’re remembering.

B. Intent Inference Engine (Key Innovation)

Before the AI writes anything, it runs an internal classification step:

What is the user doing right now?

Outlining

Defining concepts

Reviewing literature

Arguing a position

Polishing language

You can implement this as:

A lightweight classifier prompt

Runs silently every few context updates

Outputs structured intent:

{
  "stage": "literature_review",
  "confidence": 0.82,
  "active_heading": "Mental Illness in Media Representation"
}


This intent controls what kind of content the AI is allowed to generate.

3. Autonomous AI Writing Logic (No Chaos)

Your AI must not spam. Autonomy without restraint kills trust.

Trigger Rules (Examples)

AI writes when:

A new heading appears

A section is unusually short

Claims appear without citations

User pauses for X seconds after typing a heading

Output Types

Each generation is one of these, never mixed:

Suggestions

Bullet points

Source recommendations

Concept explanations

Structural feedback

This makes tagging clean and predictable.

4. AI Writing Space (This Is Crucial)

You’re 100% right: no chat UI.

AI Space Behaves Like:

A read-only editor

Streaming formatted text

Collapsible

Chronological but chunked

Chunk Metadata (Transparency Wins Trust)

Every chunk includes:

Tag (Suggestion, Sources, Analysis, etc.)

Trigger reason

“Generated based on heading: X”

“Generated due to missing citation”

Copy button

Optional “dismiss” or “pin”

This tells the user:

“I know why the AI did this.”

Judges love this.

Status Indicator (Subtle but Powerful)

States:

Idle

Thinking

Writing

Visible even when collapsed.

This creates presence without intrusion—a rare UX win.

5. Right-Click Actions (User-Controlled Precision)

This is where agency meets automation.

On text selection → right click:

Cite

Paraphrase

Expand

Summarize

Analyze

Suggest counterarguments

Rules:

Output never enters user doc automatically

Always goes to AI space

Tagged by action

Uses only selected text + surrounding context

This keeps academic integrity intact.

6. Voice Agent (The Human Layer)

This is not a gimmick. If done right, it’s lethal.

Design Principle

The voice agent:

Talks

Thinks

Delegates
But does not clutter UI.

Floating orb / bar is perfect.

Capabilities

The voice agent has access to:

Full document

AI space content

App state (collapsed/expanded, section focus)

It can:

Explain suggestions verbally

Discuss arguments

Trigger the writing agent:

“Research empirical studies on police interactions with mentally ill individuals.”

That command becomes a task, not a chat reply.

Search Grounding

Use Google grounding only when explicitly needed:

Literature validation

Source discovery

Fact checking

Voice agent narrates findings; writing agent documents them.

This division of labor is elegant.

7. What Hackathon Judges Will Love

Highlight these explicitly:

True autonomy (not prompt-based)

Context-first AI

Transparency via tagging

Academic integrity protection

Multimodal collaboration (text + voice)

Clear separation of human vs AI space

Most teams won’t think this deeply. You already are.





Additional info

## 1. The "Tagged Chunk" System
Since the AI workspace isn't a chat, you should treat it as a stream of "Intelligence Cards." Each time the AI generates something—whether autonomously or via a right-click action—it creates a new card in the AI pane.Metadata Tagging Structure:Each chunk of text should be wrapped in a container that displays:The Trigger: (e.g., "Action: Cite" or "Context: Heading 2").The Reason: A brief 1-sentence explanation from the AI: "I found this source because you mentioned the impact of microplastics on marine biology."Action Buttons: [Copy to Clipboard] [Insert at Cursor] [Dismiss].

### 2. The Context Menu (Right-Click Actions)

To implement this in Next.js, you’ll want to intercept the browser's default context menu on the User Editor.ActionAI Instruction (System Prompt)CiteSearch for peer-reviewed sources matching the selected text. Provide APA/MLA citations.ParaphraseRewrite the selection to improve flow while maintaining the original meaning and tone.ExpandElaborate on the core argument of the selection with supporting evidence.AnalyzeIdentify logical fallacies or gaps in the argument of the selected text.SuggestionsList 3 potential next steps or counter-arguments for this specific paragraph.
### 3. Status State Management
The "Thinking" vs. "Writing" labels are vital for UX, especially when the sidebar is collapsed.Thinking: Triggered the moment the User stops typing (Debounce) or clicks an Action. This indicates the Gemini 3 API call is active.Writing: Triggered as soon as the first "chunk" of the stream hits the frontend.UI Placement: I suggest a Pulse Indicator in the bottom-right corner of the User Editor.Gray Pulse: AI is idle/listening.Blue Pulse: AI is "Thinking" (Processing).Green Pulse: AI is "Writing" (Streaming to the hidden/visible pane).
### 4. UI Layout & Component Strategy
Since you are comfortable with Tailwind CSS and Next.js, here is a suggested component breakdown:ComponentResponsibilityUserEditor.tsxUses TipTap. Handles text entry and selection state.AIWorkspace.tsxA scrollable container for "Intelligence Cards." Collapsible state.IntelligenceCard.tsxDisplays the Tag, Reasoning, and the Streamed Text.StatusOrb.tsxThe floating indicator that shows "Thinking" or "Writing."ActionMenu.tsxThe custom right-click menu appearing at mouse coordinates.
### 5. Handling the 1M Token Context

Because you want the AI to "know" what triggered the generation, you should structure your prompt like this:System Prompt Snippet:"You are a Research Agent. You are monitoring a live document. Your output must be a JSON-like stream containing: 1. trigger_reason (Why you are writing this), 2. tag (The category), and 3. content (The actual research text). Use the full history of the document provided in the context to ensure citations and suggestions are consistent with previous chapters.
"### Implementation Tip: "
The Shadow Doc"Keep a hidden state in your React app that stores the entire document as a plain text string. Every 5 seconds (or on Right-Click), send this string to Gemini 3. This ensures that even if the user is on page 10, the AI remembers the thesis statement on page 1.