# Feature Name: Step In

## Feature Overview

**Step In** is the flagship feature of the application—the peak capability that fully leverages all previously implemented features. It allows the AI co-author to take full control of the writing process, temporarily assuming the role of the user to complete, continue, or entirely rewrite a piece of writing on the user’s behalf.

This feature is designed to offload cognitive and creative load, enabling users to delegate execution while retaining transparency, control, and stylistic authenticity. The goal is simple: let the AI do the heavy lifting, without sounding like AI.

---

## Activation & Interface

### Activation Method
A dedicated **“Step In”** button located at the top of the AI Space header.

### Instruction Input
The user must provide guidance under a clearly labeled **“Instructions”** heading placed at the very top of the text editor.  
These instructions act as the primary source of truth for the AI’s behavior.

---

## Core Agent Behavior (Step In Mode)

### 1. Instruction Parsing

When Step In is activated, the agent must:

- First scan the editor for an **“Instructions”** heading  
- Read and fully internalize the instructions before taking any action  
- If the user already has content written in the editor, the agent must:
  - Read and fully internalize the content before taking any action
  - it should access whether it will be neccessary to change certain portions or leave it be. 
  - The agent should never do a change or edit that will not please the user. 
  - It should always keep the users intent and goal of the writing.

If no Instructions heading exists, the agent must:

- Output a Thought Card stating that no instructions were found  
- Prompt the user to add instructions  
- Immediately halt Step In execution  

---

### 2. Planning & Transparency

After reading the instructions, the agent must:

- Develop a clear execution plan for the writing task  
- Output this plan in a Thought Card within the AI Space  

This Thought Card represents the agent’s reasoning and approach, allowing the user to understand how the AI intends to proceed before major changes occur.

---

### 3. Writing Execution (Full Control Mode)

Once active, Step In grants the AI full editorial control:

- Write directly into the text editor in real time  
- Add, delete, clean, restructure, or rewrite content as needed  
- Select and revise specific sections when necessary  
- Apply appropriate structure, citations, sources, and grounding when required by the writing context  

The AI must always respect the type of writing being produced (academic, casual, professional, creative, etc.).

---

### 4. Iterative Self-Evaluation

After completing an initial draft or section, the agent must:

- Re-read the entire output  
- Score its work against:
  - Alignment with the user’s instructions  
  - Stylistic accuracy  
  - Overall quality and coherence  

The agent then:

- Outputs this evaluation and score in a new Thought Card  
- Clearly identifies weak points, errors, or misalignments  

---

### 5. Refinement Loop

Based on its self-evaluation, the agent must:

- Re-enter the editor  
- Revise only the relevant weak or misaligned sections  
- Strengthen clarity, flow, and adherence to the user’s voice  

This loop may repeat until the agent determines the output meets a high standard.

---

### 6. Final Explanation & Accountability

Upon completion, the agent must output a final Thought Card explaining:

- What changes were made  
- Why those changes were necessary  
- How they improved alignment, style, or clarity  

This reinforces trust, explainability, and user confidence.

---

## User Control & Interruptions

- The user may pause or stop Step In at any time  

If the user restarts Step In, the agent must:

- Re-read the entire editor content  
- Re-read the **Instructions** heading  
- Detect whether instructions have changed:
  - If changed → adapt behavior accordingly  
  - If unchanged → continue seamlessly  

---

## Style & Authenticity Constraints

- The AI must mirror the user’s writing style, not impose its own  
- If the user writes in simple language, the AI must do the same  
- The output must never sound robotic, generic, or monotonous  
- The agent must actively avoid common “AI words” and phrases that degrade authenticity  
- **No emojis. Ever.**

The AI’s role is not to sound intelligent—it is to sound indistinguishable from the writer.

---

## Design Philosophy (Why This Wins the Hackathon)

**Step In** is not just automation—it is delegated authorship with visibility.  
It combines:

- Full AI execution  
- Continuous transparency  
- User-controlled interruption  
- Style preservation  
- Self-critique and refinement  

This transforms the AI from a tool into a true co-author.
