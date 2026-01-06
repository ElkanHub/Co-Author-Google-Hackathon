# AI Co-Author Application Documentation

## Overview
AI Co-Author is a next-generation writing assistant that integrates advanced AI capabilities directly into a rich text editor. It features a dual-pane interface with a dedicated "Intelligence Stream" sidebar for real-time AI suggestions, citations, and analysis, along with a powerful context menu for seamless interaction.

## Technology Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS, Lucide React (Icons)
- **State Management**: Zustand
- **Database**: Supabase (PostgreSQL)
- **Editor**: Tiptap (Headless wrapper around ProseMirror)
- **AI**: Google Gemini Pro (via `@google/generative-ai`)
- **Markdown**: `marked` for rendering AI responses

## Architecture

### Frontend Structure
- **`app/`**: Contains the Next.js App Router pages and API routes.
  - `editor/[id]/page.tsx`: Main editor interface.
  - `api/ai/`: Backend endpoints for AI generation (`generate`) and specific actions (`action`).
- **`components/`**: Reusable UI components.
  - **`editor/`**: Editor-specific components.
    - `user-editor.tsx`: Main Tiptap instance, handles selection and API integration.
    - `editor-context-menu.tsx`: Custom right-click menu with Standard and AI actions.
  - **`ai-sidebar.tsx`**: The Intelligence Stream, displaying AI cards.
  - **`ai-dynamic-island.tsx`**: Visual status indicator for AI processing.
- **`store/`**: Global state management.
  - `use-ai-store.ts`: Manages the list of AI cards (`AICard`), adding/removing/updating them.
  - `use-editor-store.ts`: specific editor state.

### Key Features & Implementation

#### 1. Smart Editor
- **Rich Text Support**: Built on Tiptap, supporting bold, italic, lists, and more.
- **Context Menu**: 
  - **Standard Actions**: System-level Copy, Cut, Paste, and Select All.
  - **AI Submenu**: Nested menu containing specific AI tools (Cite, Paraphrase, Summarize, etc.).
  - **Viewport Logic**: The menu intelligently adjusts its position (flipping left/right or up/down) to stay visible on screen.

#### 2. Intelligence Stream (Sidebar)
- **Live AI Cards**: Displays generated content as cards.
- **Card Types**: 
  - `Suggestion` (Purple Sparkles)
  - `Citation` (Blue Book)
  - `Analysis` (Orange Alert)
  - `Action` (Yellow Zap) - User-triggered actions.
- **Search**: Real-time filtering of cards by text content or reasoning.
- **Filters**: Tag-based filtering (e.g., "Show only Citations").
- **Typewriter Effect**: AI content streams in character-by-character for a natural feel (disabled for historical/database-loaded content).
- **Actions**:
  - **Copy**: Renders Markdown to HTML/Text for clipboard.
  - **Delete**: Remove individual cards.

#### 3. AI Integration
- **Context Awareness**: The AI analyzes the user's selected text *and* the surrounding context to generate relevant responses.
- **Optimistic UI**: "Thinking..." cards appear immediately upon request to reduce perceived latency.
- **Structured Response**: AI returns JSON with `type`, `reason`, and `content` for precise UI rendering.

#### 4. Data Sync
- **Supabase**: Documents and AI cards are synced to a Supabase database.
- **Real-time**: Content updates are debounced and saved automatically.

## Design System
- **Theme**: Dark/Light mode support (Zinc palette).
- **Aesthetics**: Clean, minimal interface with glassmorphism effects (`backdrop-blur`).
- **Scrollbars**: Custom thin, expanded-on-hover scrollbars for a refined look.

## API Endpoints
- **`POST /api/ai/action`**: Handles specific actions (Cite, Paraphrase, etc.).
  - Input: `{ action, selection, context }`
  - Output: `AICard` object.
- **`POST /api/ai/generate`**: General generation endpoint (currently used for background analysis).
