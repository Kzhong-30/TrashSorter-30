import { useStoryStore } from "@/store/storyStore";
import type { BlockType, StoryBlock, TransitionType } from "@/types/story";
import {
  Type,
  Image,
  Video,
  GitBranch,
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  Move,
  Settings,
  Palette,
  Link2,
  ArrowRight,
  X,
  Play,
  Pause,
  ImageOff,
  Film,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ConfirmModal } from "./ConfirmModal";

const blockTypeConfig: Record<
  BlockType,
  { label: string; icon: typeof Type; color: string }
> = {
  text: { label: "文本", icon: Type, color: "from-blue-500 to-cyan-500" },
  image: { label: "图片", icon: Image, color: "from-pink-500 to-rose-500" },
  video: { label: "视频", icon: Video, color: "from-amber-500 to-orange-500" },
  choice: {
    label: "选择分支",
    icon: GitBranch,
    color: "from-violet-500 to-purple-500",
  },
};

interface BlockEditorProps {
  block: StoryBlock;
  chapterId: string;
  index: number;
  total: number;
}

const LoadingMediaPlaceholder: React.FC<{
  text: string;
}> = ({ text }) => (
  <div className="w-full h-48 rounded-xl bg-slate-900/50 border border-slate-700/50 flex flex-col items-center justify-center gap-2 text-slate-500 animate-pulse">
    <Loader2 size={28} className="animate-spin text-violet-400" />
    <span className="text-xs">{text}</span>
  </div>
);

const FailedMediaPlaceholder: React.FC<{
  icon: React.ReactNode;
  text: string;
}> = ({ icon, text }) => (
  <div className="w-full h-48 rounded-xl bg-slate-900/80 border border-slate-700/50 flex flex-col items-center justify-center gap-2 text-slate-500">
    <div className="p-3 rounded-full bg-slate-800">{icon}</div>
    <span className="text-xs">{text}</span>
  </div>
);

function BlockEditor({ block, chapterId, index, total }: BlockEditorProps) {
  const {
    selectedBlockId,
    selectBlock,
    updateBlock,
    deleteBlock,
    moveBlock,
    addChoice,
    updateChoice,
    deleteChoice,
    project,
    addChapter,
    selectChapter,
  } = useStoryStore();

  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const [jumpPrompt, setJumpPrompt] = useState<{
    open: boolean;
    newChapterId: string | null;
    newChapterTitle: string;
  }>({ open: false, newChapterId: null, newChapterTitle: "" });

  const isSelected = selectedBlockId === block.id;
  const config = blockTypeConfig[block.type];
  const Icon = config.icon;

  const chapters = Object.values(project.chapters);

  useEffect(() => {
    if (block.type === "image") {
      setImageError(false);
      setImageLoading(true);
    }
    if (block.type === "video") {
      setVideoError(false);
      setVideoLoading(true);
    }
  }, [block.content, block.type]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      onClick={() => selectBlock(block.id)}
      className={`relative rounded-2xl border-2 transition-all overflow-hidden ${
        isSelected
          ? "border-violet-500 shadow-xl shadow-violet-500/20 bg-slate-800"
          : "border-slate-700/50 bg-slate-800/50 hover:border-slate-600"
      }`}
    >
      <div
        className={`flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r ${config.color}/10 border-b ${
          isSelected ? "border-violet-500/50" : "border-slate-700/50"
        }`}
      >
        <div
          className={`p-1.5 rounded-lg bg-gradient-to-r ${config.color} text-white`}
        >
          <Icon size={14} />
        </div>
        <span className="text-sm font-medium text-white">
          {index + 1}. {config.label}块
        </span>
        <div className="flex-1" />
        <div className="flex items-center gap-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              moveBlock(chapterId, block.id, "up");
            }}
            disabled={index === 0}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="上移"
          >
            <ChevronUp size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              moveBlock(chapterId, block.id, "down");
            }}
            disabled={index === total - 1}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="下移"
          >
            <ChevronDown size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteBlock(chapterId, block.id);
            }}
            className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
            title="删除"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="p-4">
        {block.type === "text" && (
          <textarea
            value={block.content}
            onChange={(e) =>
              updateBlock(chapterId, block.id, { content: e.target.value })
            }
            onClick={(e) => e.stopPropagation()}
            placeholder="在这里输入故事文本..."
            rows={6}
            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none text-sm leading-relaxed"
          />
        )}

        {block.type === "image" && (
          <div className="space-y-3">
            <input
              type="url"
              value={block.content}
              onChange={(e) =>
                updateBlock(chapterId, block.id, { content: e.target.value })
              }
              onClick={(e) => e.stopPropagation()}
              placeholder="输入图片 URL..."
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 text-sm"
            />
            {block.content ? (
              imageError ? (
                <FailedMediaPlaceholder
                  icon={<ImageOff size={20} />}
                  text="图片加载失败，请检查 URL 是否正确"
                />
              ) : imageLoading ? (
                <LoadingMediaPlaceholder text="图片加载中..." />
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl overflow-hidden border border-slate-700/50"
                >
                  <img
                    src={block.content}
                    alt="预览"
                    className="w-full max-h-64 object-cover"
                    onError={() => setImageError(true)}
                    onLoad={() => setImageLoading(false)}
                  />
                </motion.div>
              )
            ) : null}
          </div>
        )}

        {block.type === "video" && (
          <div className="space-y-3">
            <input
              type="url"
              value={block.content}
              onChange={(e) =>
                updateBlock(chapterId, block.id, { content: e.target.value })
              }
              onClick={(e) => e.stopPropagation()}
              placeholder="输入视频 URL (mp4)..."
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 text-sm"
            />
            {block.content ? (
              videoError ? (
                <FailedMediaPlaceholder
                  icon={<Film size={20} />}
                  text="视频加载失败，请检查 URL 是否正确"
                />
              ) : videoLoading ? (
                <LoadingMediaPlaceholder text="视频加载中..." />
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl overflow-hidden border border-slate-700/50 bg-black"
                >
                  <video
                    src={block.content}
                    controls
                    className="w-full max-h-64"
                    onError={() => setVideoError(true)}
                    onLoadedData={() => setVideoLoading(false)}
                  />
                </motion.div>
              )
            ) : null}
          </div>
        )}

        {block.type === "choice" && (
          <div className="space-y-3">
            {block.choices?.map((choice) => {
              const targetChapter = choice.nextChapterId
                ? project.chapters[choice.nextChapterId]
                : null;
              return (
                <motion.div
                  key={choice.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50"
                >
                  <div className="flex gap-2 items-start mb-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={choice.label}
                        onChange={(e) =>
                          updateChoice(chapterId, block.id, choice.id, {
                            label: e.target.value,
                          })
                        }
                        onClick={(e) => e.stopPropagation()}
                        placeholder="选项内容..."
                        className="w-full bg-transparent border-b border-slate-700 px-2 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 text-sm"
                      />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChoice(chapterId, block.id, choice.id);
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 shrink-0 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link2 size={12} className="text-slate-500 shrink-0" />
                    <select
                      value={choice.nextChapterId || ""}
                      onChange={(e) =>
                        updateChoice(chapterId, block.id, choice.id, {
                          nextChapterId: e.target.value || null,
                        })
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-violet-500"
                    >
                      <option value="">-- 选择跳转章节 --</option>
                      {chapters.map((ch) => (
                        <option key={ch.id} value={ch.id}>
                          {ch.title}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newCh = addChapter(chapterId, choice.label, false);
                        updateChoice(chapterId, block.id, choice.id, {
                          nextChapterId: newCh.id,
                        });
                        setJumpPrompt({
                          open: true,
                          newChapterId: newCh.id,
                          newChapterTitle: newCh.title,
                        });
                      }}
                      className="flex items-center gap-1 px-2 py-1.5 bg-violet-500/20 text-violet-400 rounded-lg hover:bg-violet-500/30 text-xs shrink-0 transition-colors"
                    >
                      <Plus size={12} />
                      新建
                    </button>
                  </div>
                  {targetChapter && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 rounded-lg px-2 py-1">
                      <ArrowRight size={12} />
                      跳转到: {targetChapter.title}
                    </div>
                  )}
                </motion.div>
              );
            })}
            <button
              onClick={(e) => {
                e.stopPropagation();
                addChoice(chapterId, block.id);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-slate-700 rounded-xl text-slate-500 hover:text-violet-400 hover:border-violet-500/50 transition-all text-sm"
            >
              <Plus size={16} />
              添加选项
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        open={jumpPrompt.open}
        title="新章节已创建"
        confirmText="立即跳转"
        cancelText="留在这里继续编辑"
        onConfirm={() => {
          if (jumpPrompt.newChapterId) {
            selectChapter(jumpPrompt.newChapterId);
          }
          setJumpPrompt({ open: false, newChapterId: null, newChapterTitle: "" });
        }}
        onCancel={() =>
          setJumpPrompt({ open: false, newChapterId: null, newChapterTitle: "" })
        }
        message={
          <div className="space-y-2">
            <p className="text-sm text-slate-400">
              分支章节
              <span className="mx-1 font-semibold text-violet-400">
                「{jumpPrompt.newChapterTitle}」
              </span>
              已成功创建并关联到当前选项。
            </p>
            <p className="text-sm text-slate-400">
              是否跳转到新章节继续撰写？默认保持在当前页面，您可以稍后从左侧故事树中选择它。
            </p>
          </div>
        }
      />
    </motion.div>
  );
}

export default function ChapterEditor() {
  const {
    selectedChapterId,
    project,
    updateChapter,
    addBlock,
    updateTransition,
    updateChapterBgMusic,
    updateChapterBgImage,
    isPreviewMode,
  } = useStoryStore();

  const [showSettings, setShowSettings] = useState(false);
  const [chapterMusicPlaying, setChapterMusicPlaying] = useState(false);
  const [chapterVolume, setChapterVolume] = useState(0.5);
  const chapterMusicRef = useRef<HTMLAudioElement | null>(null);

  const chapter = selectedChapterId
    ? project.chapters[selectedChapterId]
    : null;

  useEffect(() => {
    setChapterMusicPlaying(false);
    if (chapterMusicRef.current) {
      chapterMusicRef.current.pause();
      chapterMusicRef.current = null;
    }
    if (chapter?.bgMusicUrl) {
      chapterMusicRef.current = new Audio(chapter.bgMusicUrl);
      chapterMusicRef.current.loop = true;
      chapterMusicRef.current.volume = chapterVolume;
    }
    return () => {
      chapterMusicRef.current?.pause();
      chapterMusicRef.current = null;
    };
  }, [selectedChapterId, chapter?.bgMusicUrl]);

  useEffect(() => {
    if (chapterMusicRef.current) {
      chapterMusicRef.current.volume = chapterVolume;
    }
  }, [chapterVolume]);

  useEffect(() => {
    if (isPreviewMode) {
      chapterMusicRef.current?.pause();
      setChapterMusicPlaying(false);
    }
  }, [isPreviewMode]);

  const toggleChapterMusic = () => {
    if (!chapterMusicRef.current || !chapter?.bgMusicUrl) return;
    if (chapterMusicPlaying) {
      chapterMusicRef.current.pause();
    } else {
      chapterMusicRef.current.play().catch(() => {});
    }
    setChapterMusicPlaying(!chapterMusicPlaying);
  };

  if (!chapter) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 bg-gradient-to-br from-slate-900 via-slate-900/80 to-slate-800">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center mb-6"
        >
          <Move size={40} className="text-violet-400" />
        </motion.div>
        <p className="text-lg font-medium mb-2">选择一个章节开始编辑</p>
        <p className="text-sm">从左侧故事树中选择章节</p>
      </div>
    );
  }

  const transitionOptions: TransitionType[] = ["fade", "slide", "zoom", "flip"];
  const transitionLabels: Record<TransitionType, string> = {
    fade: "淡入淡出",
    slide: "滑动",
    zoom: "缩放",
    flip: "翻页",
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-slate-900/80 to-slate-800">
      <div className="p-4 border-b border-slate-700/50 bg-slate-900/50 backdrop-blur">
        <div className="flex items-start gap-4">
          <div className="flex-1 space-y-3">
            <input
              type="text"
              value={chapter.title}
              onChange={(e) =>
                updateChapter(chapter.id, { title: e.target.value })
              }
              className="w-full bg-transparent text-2xl font-bold text-white placeholder-slate-500 focus:outline-none border-b-2 border-transparent focus:border-violet-500 pb-1"
              placeholder="章节标题..."
            />
            <div className="flex gap-3 text-xs text-slate-400 flex-wrap">
              <span>
                章节 ID:{" "}
                <code className="text-violet-400">
                  {chapter.id.slice(0, 8)}
                </code>
              </span>
              <span>•</span>
              <span>{chapter.blocks.length} 个内容块</span>
              {chapter.parentId && (
                <>
                  <span>•</span>
                  <span className="text-sky-400">
                    父章节:{" "}
                    {project.chapters[chapter.parentId]?.title || "未知"}
                  </span>
                </>
              )}
              {chapter.bgMusicUrl && (
                <>
                  <span>•</span>
                  <span className="text-purple-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                    已配配乐
                  </span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-3 rounded-xl transition-all ${
              showSettings
                ? "bg-violet-500/20 text-violet-400 border border-violet-500/50"
                : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
            }`}
            title="章节设置"
          >
            <Settings size={18} />
          </button>
        </div>

        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-slate-700/50 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                    <Palette size={12} /> 背景图片 URL
                  </label>
                  <input
                    type="url"
                    value={chapter.bgImageUrl || ""}
                    onChange={(e) =>
                      updateChapterBgImage(
                        chapter.id,
                        e.target.value || undefined
                      )
                    }
                    placeholder="可选：章节背景图..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                    <Video size={12} /> 章节配乐 URL
                  </label>
                  <input
                    type="url"
                    value={chapter.bgMusicUrl || ""}
                    onChange={(e) =>
                      updateChapterBgMusic(
                        chapter.id,
                        e.target.value || undefined
                      )
                    }
                    placeholder="可选：背景音乐 (mp3/wav)..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={toggleChapterMusic}
                      disabled={!chapter.bgMusicUrl}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                        chapterMusicPlaying
                          ? "bg-purple-500 text-white shadow-sm shadow-purple-500/30"
                          : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                      }`}
                    >
                      {chapterMusicPlaying ? (
                        <>
                          <Pause size={12} /> 暂停
                        </>
                      ) : (
                        <>
                          <Play size={12} /> 试听
                        </>
                      )}
                    </button>
                    <span className="text-slate-500 text-xs w-10">
                      {Math.round(chapterVolume * 100)}%
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={chapterVolume}
                      onChange={(e) =>
                        setChapterVolume(parseFloat(e.target.value))
                      }
                      className="flex-1 accent-purple-500 disabled:opacity-50"
                      disabled={!chapter.bgMusicUrl}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400">
                    过渡动画类型
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {transitionOptions.map((opt) => (
                      <button
                        key={opt}
                        onClick={() =>
                          updateTransition(chapter.id, {
                            ...chapter.transition,
                            type: opt,
                          })
                        }
                        className={`py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                          chapter.transition.type === opt
                            ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/30"
                            : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                        }`}
                      >
                        {transitionLabels[opt]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400">
                    动画时长: {chapter.transition.duration.toFixed(1)}s
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="2"
                    step="0.1"
                    value={chapter.transition.duration}
                    onChange={(e) =>
                      updateTransition(chapter.id, {
                        ...chapter.transition,
                        duration: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-violet-500"
                  />
                  {chapter.transition.type === "slide" && (
                    <div className="flex gap-1.5 mt-2">
                      {(["left", "right", "up", "down"] as const).map((dir) => (
                        <button
                          key={dir}
                          onClick={() =>
                            updateTransition(chapter.id, {
                              ...chapter.transition,
                              direction: dir,
                            })
                          }
                          className={`flex-1 py-1 px-2 rounded text-xs transition-colors ${
                            chapter.transition.direction === dir
                              ? "bg-violet-500/30 text-violet-300"
                              : "bg-slate-800 text-slate-500 hover:bg-slate-700"
                          }`}
                        >
                          {dir === "left"
                            ? "← 左"
                            : dir === "right"
                            ? "右 →"
                            : dir === "up"
                            ? "↑ 上"
                            : "下 ↓"}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <AnimatePresence initial={false}>
            {chapter.blocks.map((block, idx) => (
              <BlockEditor
                key={block.id}
                block={block}
                chapterId={chapter.id}
                index={idx}
                total={chapter.blocks.length}
              />
            ))}
          </AnimatePresence>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            {(Object.keys(blockTypeConfig) as BlockType[]).map((type) => {
              const cfg = blockTypeConfig[type];
              const I = cfg.icon;
              return (
                <motion.button
                  key={type}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => addBlock(chapter.id, type)}
                  className="group relative flex flex-col items-center gap-2 py-4 px-2 rounded-2xl border-2 border-dashed border-slate-700/50 hover:border-transparent hover:bg-slate-800/50 transition-all"
                >
                  <div
                    className={`p-3 rounded-xl bg-gradient-to-r ${cfg.color} text-white shadow-lg opacity-60 group-hover:opacity-100 transition-opacity`}
                  >
                    <I size={18} />
                  </div>
                  <span className="text-xs font-medium text-slate-400 group-hover:text-white transition-colors">
                    {cfg.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
