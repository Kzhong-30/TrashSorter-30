import { useStoryStore } from "@/store/storyStore";
import { Plus, Trash2, GitBranch, Home, Layers, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Chapter } from "@/types/story";
import { useState } from "react";
import { ConfirmModal } from "./ConfirmModal";

interface TreeNodeProps {
  chapter: Chapter;
  level: number;
  childrenIds: string[];
}

const collectDescendants = (
  chapterId: string,
  chapters: Record<string, Chapter>
): string[] => {
  const result: string[] = [];
  const stack = [chapterId];
  while (stack.length > 0) {
    const cur = stack.pop()!;
    Object.values(chapters).forEach((c) => {
      if (c.parentId === cur) {
        result.push(c.id);
        stack.push(c.id);
      }
    });
  }
  return result;
};

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

        <div className="flex items-center gap-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              addChapter(chapter.id);
            }}
            className={`p-1 rounded hover:bg-black/30 transition-colors ${
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

  const [confirmDelete, setConfirmDelete] = useState(false);

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

  const selectedChapter = selectedChapterId
    ? project.chapters[selectedChapterId]
    : null;

  const descendants =
    selectedChapterId && selectedChapter
      ? collectDescendants(selectedChapterId, project.chapters)
      : [];

  const descendantTitles = descendants
    .slice(0, 6)
    .map((id) => project.chapters[id]?.title)
    .filter(Boolean);
  const moreCount = descendants.length - descendantTitles.length;

  const handleDelete = () => {
    if (selectedChapterId) {
      deleteChapter(selectedChapterId);
    }
    setConfirmDelete(false);
  };

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
        {selectedChapterId && !project.rootChapterId
          ? selectedChapterId
          : selectedChapter && (
              <button
                onClick={() => setConfirmDelete(true)}
                className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-all text-sm ${
                  project.rootChapterId === selectedChapterId
                    ? "bg-slate-800/50 text-slate-500 cursor-not-allowed"
                    : "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20"
                }`}
                disabled={project.rootChapterId === selectedChapterId}
              >
                <Trash2 size={14} />
                {project.rootChapterId === selectedChapterId
                  ? "根章节不可删除"
                  : "删除选中章节"}
              </button>
            )}
      </div>

      <ConfirmModal
        open={confirmDelete}
        title={`删除「${selectedChapter?.title || ""}」`}
        confirmText="确认删除"
        cancelText="取消"
        confirmDanger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        message={
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-red-500">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span className="text-sm">此操作无法撤销，请仔细确认。</span>
            </div>
            {descendants.length > 0 ? (
              <div>
                <p className="text-sm mb-2 font-medium">
                  将同步删除该章节下所有
                  <span className="text-red-500 font-bold mx-1">
                    {descendants.length}
                  </span>
                  个子章节：
                </p>
                <ul className="text-xs space-y-1 text-slate-500 bg-slate-900/50 rounded-lg p-2.5 max-h-32 overflow-y-auto">
                  {descendantTitles.map((t, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-slate-500" />
                      {t}
                    </li>
                  ))}
                  {moreCount > 0 && (
                    <li className="text-slate-500 italic">
                      还有 {moreCount} 个章节未显示...
                    </li>
                  )}
                </ul>
              </div>
            ) : (
              <p className="text-sm">该章节没有子章节，将直接删除。</p>
            )}
          </div>
        }
      />
    </div>
  );
}
