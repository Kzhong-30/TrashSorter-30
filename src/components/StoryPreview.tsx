import { useStoryStore } from "@/store/storyStore";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  RotateCcw,
  ChevronLeft,
  Volume2,
  VolumeX,
  BookOpen,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Chapter, TransitionConfig } from "@/types/story";

const getTransitionVariants = (transition: TransitionConfig) => {
  const duration = transition.duration || 0.5;
  const ease = "easeInOut";

  switch (transition.type) {
    case "slide": {
      const dir = transition.direction || "left";
      const xMap = { left: 100, right: -100, up: 0, down: 0 };
      const yMap = { left: 0, right: 0, up: 100, down: -100 };
      return {
        initial: {
          opacity: 0,
          x: xMap[dir],
          y: yMap[dir],
        },
        animate: { opacity: 1, x: 0, y: 0 },
        exit: {
          opacity: 0,
          x: -xMap[dir],
          y: -yMap[dir],
        },
        transition: { duration, ease },
      };
    }
    case "zoom":
      return {
        initial: { opacity: 0, scale: 0.8 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 1.2 },
        transition: { duration, ease },
      };
    case "flip":
      return {
        initial: { opacity: 0, rotateY: -90 },
        animate: { opacity: 1, rotateY: 0 },
        exit: { opacity: 0, rotateY: 90 },
        transition: { duration, ease },
      };
    case "fade":
    default:
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration, ease },
      };
  }
};

interface ChapterViewProps {
  chapter: Chapter;
  onChoice: (nextId: string | null) => void;
  onBack: () => void;
  canGoBack: boolean;
}

function ChapterView({ chapter, onChoice, onBack, canGoBack }: ChapterViewProps) {
  const variants = getTransitionVariants(chapter.transition);

  return (
    <motion.div
      key={chapter.id}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      className="min-h-full w-full"
      style={{
        perspective: "1000px",
        backgroundImage: chapter.bgImageUrl
          ? `url(${chapter.bgImageUrl})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        className={`min-h-screen ${
          chapter.bgImageUrl ? "bg-black/60 backdrop-blur-sm" : ""
        }`}
      >
        <div className="max-w-3xl mx-auto px-6 py-12">
          {canGoBack && (
            <button
              onClick={onBack}
              className="mb-6 flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <ChevronLeft size={18} />
              <span>返回上一章</span>
            </button>
          )}

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-bold text-white mb-2"
          >
            {chapter.title}
          </motion.h1>

          <div className="space-y-6 mt-10">
            {chapter.blocks.map((block, idx) => (
              <motion.div
                key={block.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
              >
                {block.type === "text" && (
                  <p className="text-lg text-white/90 leading-relaxed whitespace-pre-wrap">
                    {block.content}
                  </p>
                )}

                {block.type === "image" && block.content && (
                  <img
                    src={block.content}
                    alt=""
                    className="w-full rounded-2xl shadow-2xl max-h-96 object-cover"
                  />
                )}

                {block.type === "video" && block.content && (
                  <video
                    src={block.content}
                    controls
                    className="w-full rounded-2xl shadow-2xl"
                  />
                )}

                {block.type === "choice" && block.choices && (
                  <div className="space-y-3 mt-8">
                    {block.choices.map((choice, cIdx) => (
                      <motion.button
                        key={choice.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + idx * 0.1 + cIdx * 0.05 }}
                        whileHover={{ x: 8, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onChoice(choice.nextChapterId)}
                        className="w-full text-left p-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white hover:bg-white/20 hover:border-violet-400/50 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-sm font-bold shrink-0 group-hover:scale-110 transition-transform">
                            {String.fromCharCode(65 + cIdx)}
                          </div>
                          <span className="text-lg font-medium">
                            {choice.label}
                          </span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {!chapter.blocks.some((b) => b.type === "choice") && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + chapter.blocks.length * 0.1 }}
              className="mt-12 text-center text-white/60 italic"
            >
              — 本章结束 —
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function StoryPreview() {
  const {
    project,
    currentPreviewChapterId,
    setPreviewChapter,
    togglePreviewMode,
    resetPreview,
    visitedChapters,
  } = useStoryStore();

  const [history, setHistory] = useState<string[]>(
    project.rootChapterId ? [project.rootChapterId] : []
  );
  const [bgSoundPlaying, setBgSoundPlaying] = useState(false);
  const [chapterMusicPlaying, setChapterMusicPlaying] = useState(false);

  const bgSoundRef = useRef<HTMLAudioElement | null>(null);
  const chapterMusicRef = useRef<HTMLAudioElement | null>(null);

  const currentChapter = currentPreviewChapterId
    ? project.chapters[currentPreviewChapterId]
    : null;

  const handleChoice = (nextId: string | null) => {
    if (!nextId) return;
    setHistory((h) => [...h, nextId]);
    setPreviewChapter(nextId);
  };

  const handleBack = () => {
    if (history.length <= 1) return;
    const newHistory = history.slice(0, -1);
    setHistory(newHistory);
    setPreviewChapter(newHistory[newHistory.length - 1]);
  };

  useEffect(() => {
    if (project.bgSoundUrl) {
      bgSoundRef.current = new Audio(project.bgSoundUrl);
      bgSoundRef.current.loop = true;
      bgSoundRef.current.volume = 0.3;
    }
    return () => {
      bgSoundRef.current?.pause();
      bgSoundRef.current = null;
    };
  }, [project.bgSoundUrl]);

  useEffect(() => {
    chapterMusicRef.current?.pause();
    chapterMusicRef.current = null;
    setChapterMusicPlaying(false);

    if (currentChapter?.bgMusicUrl) {
      chapterMusicRef.current = new Audio(currentChapter.bgMusicUrl);
      chapterMusicRef.current.loop = true;
      chapterMusicRef.current.volume = 0.5;
      if (chapterMusicPlaying) {
        chapterMusicRef.current.play().catch(() => {});
      }
    }
  }, [currentPreviewChapterId]);

  const toggleBgSound = () => {
    if (!bgSoundRef.current) return;
    if (bgSoundPlaying) {
      bgSoundRef.current.pause();
    } else {
      bgSoundRef.current.play().catch(() => {});
    }
    setBgSoundPlaying(!bgSoundPlaying);
  };

  const toggleChapterMusic = () => {
    if (!chapterMusicRef.current) return;
    if (chapterMusicPlaying) {
      chapterMusicRef.current.pause();
    } else {
      chapterMusicRef.current.play().catch(() => {});
    }
    setChapterMusicPlaying(!chapterMusicPlaying);
  };

  const handleClose = () => {
    bgSoundRef.current?.pause();
    chapterMusicRef.current?.pause();
    setBgSoundPlaying(false);
    setChapterMusicPlaying(false);
    togglePreviewMode();
  };

  const handleReset = () => {
    setHistory(project.rootChapterId ? [project.rootChapterId] : []);
    resetPreview();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950">
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
            <BookOpen size={18} className="text-white" />
          </div>
          <div>
            <div className="text-white font-semibold">{project.title}</div>
            <div className="text-white/60 text-xs">
              进度: {visitedChapters.length}/
              {Object.keys(project.chapters).length} 章
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 mr-2">
            {project.bgSoundUrl && (
              <button
                onClick={toggleBgSound}
                className={`p-2 rounded-lg backdrop-blur-sm transition-all ${
                  bgSoundPlaying
                    ? "bg-violet-500 text-white"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
                title="背景音效"
              >
                {bgSoundPlaying ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
            )}
            {currentChapter?.bgMusicUrl && (
              <button
                onClick={toggleChapterMusic}
                className={`p-2 rounded-lg backdrop-blur-sm transition-all ${
                  chapterMusicPlaying
                    ? "bg-purple-500 text-white"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
                title="章节配乐"
              >
                {chapterMusicPlaying ? (
                  <Volume2 size={16} />
                ) : (
                  <VolumeX size={16} />
                )}
              </button>
            )}
          </div>

          <button
            onClick={handleReset}
            className="p-2 rounded-lg bg-white/10 backdrop-blur-sm text-white/70 hover:bg-white/20 hover:text-white transition-all"
            title="重新开始"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg bg-white/10 backdrop-blur-sm text-white/70 hover:bg-red-500/50 hover:text-white transition-all"
            title="退出预览"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="h-full overflow-y-auto">
        <AnimatePresence mode="wait">
          {currentChapter && (
            <ChapterView
              key={currentChapter.id}
              chapter={currentChapter}
              onChoice={handleChoice}
              onBack={handleBack}
              canGoBack={history.length > 1}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
