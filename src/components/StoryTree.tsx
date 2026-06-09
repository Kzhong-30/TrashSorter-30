import { useStoryStore } from "@/store/storyStore";
import { Plus, Trash2, GitBranch, Home, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Chapter } from "@/types/story";
import { useState } from "react";

interface TreeNodeProps {
  chapter: Chapter;
  level: number;
  childrenIds: string[];
}

const TreeNode = ({ chapter, level, childrenIds }: TreeNodeProps) => {
  const {
    selectedChapterId,
    selectChapter,
    addChapter,
    project,
    visitedChapters,
  } = useStoryStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const isSelected = selectedChapterId === chapter.id;
  const isRoot = project.rootChapterId === chapter.id;
  const isVisited = visitedChapters.includes(chapter.id);

  return (
    <div className="select-none">
      <motion.div
        layout
        onClick={() => selectChapter(chapter.id)}
        className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all mb-1 ${
          isSelected
            ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/30"
            : "hover:bg-white/10 text-slate-300 hover:text-white"
        }`}
        style={{ marginLeft: `${level * 16}px` }}
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
      >
        {childrenIds.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className={`p-0.5 rounded hover:bg-black/20 transition-colors ${
              isSelected ? "text-white" : "text-slate-500"
            }`}
          >
            <motion.div animate={{ rotate: isExpanded ? 90 : 0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </motion.div>
          </button>
        )}
        {childrenIds.length === 0 && <div className="w-4" />}

        {isRoot ? (
          <Home size={14} className="shrink-0" />
        ) : (
          <Layers size={14} className="shrink-0 opacity-70" />
        )}

        <span className="flex-1 truncate text-sm font-medium">
          {chapter.title}
        </span>

        {isVisited && !isSelected && (
          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
        )}

        {childrenIds.length > 0 && (
          <span
            className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${
              isSelected
                ? "bg-white/20 text-white"
                : "bg-slate-700 text-slate-400"
            }`}
          >
            {childrenIds.length}
          </span>
        )}

        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              addChapter(chapter.id);
            }}
            className={`p-1 rounded hover:bg-black/30 ${
              isSelected ? "text-white" : "text-slate-400 hover:text-emerald-400"
            }`}
            title="添加子章节"
          >
            <Plus size={14} />
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {isExpanded && childrenIds.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {childrenIds.map((childId) => {
              const child = project.chapters[childId];
              if (!child) return null;
              const grandChildren = Object.values(project.chapters)
                .filter((c) => c.parentId === childId)
                .map((c) => c.id);
              return (
                <TreeNode
                  key={childId}
                  chapter={child}
                  level={level + 1}
                  childrenIds={grandChildren}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function StoryTree() {
  const { project, addChapter, deleteChapter, selectedChapterId } =
    useStoryStore();

  const rootChildren = project.rootChapterId
    ? Object.values(project.chapters)
        .filter((c) => c.parentId === project.rootChapterId)
        .map((c) => c.id)
    : [];

  const rootChapter = project.rootChapterId
    ? project.chapters[project.rootChapterId]
    : null;

  const chapterCount = Object.keys(project.chapters).length;
  const branchCount =
    chapterCount - (project.rootChapterId ? 1 : 0);

  return (
    <div className="h-full flex flex-col bg-slate-900/50 backdrop-blur-xl border-r border-slate-700/50">
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-2 mb-3">
          <GitBranch className="text-violet-400" size={20} />
          <h2 className="text-lg font-bold text-white">故事树</h2>
        </div>
        <div className="flex gap-2 text-xs">
          <div className="flex-1 bg-slate-800/50 rounded-lg px-3 py-2">
            <div className="text-slate-500">章节</div>
            <div className="text-white font-bold text-lg">{chapterCount}</div>
          </div>
          <div className="flex-1 bg-slate-800/50 rounded-lg px-3 py-2">
            <div className="text-slate-500">分支</div>
            <div className="text-violet-400 font-bold text-lg">
              {branchCount}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {rootChapter ? (
          <TreeNode
            chapter={rootChapter}
            level={0}
            childrenIds={rootChildren}
          />
        ) : (
          <div className="text-center text-slate-500 py-8 text-sm">
            暂无章节
          </div>
        )}
      </div>

      <div className="p-3 border-t border-slate-700/50 space-y-2">
        <button
          onClick={() => addChapter(null)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:from-violet-500 hover:to-purple-500 transition-all text-sm font-medium shadow-lg shadow-violet-500/20"
        >
          <Plus size={16} />
          新建章节
        </button>
        {selectedChapterId && (
          <button
            onClick={() => deleteChapter(selectedChapterId)}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-all text-sm"
          >
            <Trash2 size={14} />
            删除选中章节
          </button>
        )}
      </div>
    </div>
  );
}
