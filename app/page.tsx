import { UserEditor } from "@/components/editor/user-editor";

export default function Home() {
  return (
    <div className="flex h-screen w-full bg-zinc-50 dark:bg-black overflow-hidden font-sans">
      {/* Main Workspace */}
      <div className="flex-1 flex flex-col h-full relative transition-all duration-300 ease-in-out">

        {/* Header / Nav (Minimal) */}
        <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center px-6 justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">Co-Author</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-medium">Research Mode</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Future: User Profile, Export, etc */}
          </div>
        </header>

        {/* Editor Container */}
        <main className="flex-1 overflow-hidden p-6 flex justify-center">
          <div className="w-full max-w-[850px] h-full"> {/* A4-ish max width */}
            <UserEditor />
          </div>
        </main>
      </div>

      {/* AI Space Placeholder (Stage 2) */}
      {/* 
        <div className="w-[400px] border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 h-full hidden lg:flex flex-col">
          AI Space
        </div> 
      */}
    </div>
  );
}
