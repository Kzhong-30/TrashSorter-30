import { useStoryStore } from "@/store/storyStore";
import StoryTree from "@/components/StoryTree";
import ChapterEditor from "@/components/ChapterEditor";
import StoryPreview from "@/components/StoryPreview";
import Toolbar from "@/components/Toolbar";
import { AnimatePresence } from "framer-motion";

export default function Home() {
  const { isPreviewMode } = useStoryStore();

  return (
    <div className="h-screen w-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      <Toolbar />

      <div className="flex-1 flex min-h-0">
        <aside className="w-72 shrink-0 hidden md:block">
          <StoryTree />
        </aside>

        <main className="flex-1 min-w-0">
          <ChapterEditor />
        </main>
      </div>

      <AnimatePresence>
        {isPreviewMode && <StoryPreview />}
      </AnimatePresence>
    </div>
  );
}
