import { useStoryStore } from "@/store/storyStore";
import type { StoryProject, Chapter, TransitionConfig } from "@/types/story";
import {
  Play,
  Download,
  Save,
  Upload,
  Sparkles,
  PenTool,
  Clock,
  Volume2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useRef, useState } from "react";

const generateStaticHTML = (project: StoryProject) => {
  const projectJson = JSON.stringify(project);
  const buildDate = new Date().toLocaleString("zh-CN");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${project.title}</title>
<meta name="description" content="${project.description || ""}" />
<script src="https://cdn.tailwindcss.com"></script>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    background: #0f172a;
    color: #fff;
    min-height: 100vh;
  }
  .story-bg {
    min-height: 100vh;
    background-size: cover;
    background-position: center;
    transition: background-image 0.3s ease;
  }
  .choice-btn {
    transition: all 0.25s ease;
  }
  .choice-btn:hover {
    transform: translateX(8px) scale(1.02);
    background: rgba(255,255,255,0.15);
    border-color: rgba(167, 139, 250, 0.5);
  }
  .fade-enter { opacity: 0; animation: fadeIn var(--dur, 0.5s) ease forwards; }
  .slide-enter-left { opacity: 0; transform: translateX(100px); animation: slideInL var(--dur, 0.5s) ease forwards; }
  .slide-enter-right { opacity: 0; transform: translateX(-100px); animation: slideInR var(--dur, 0.5s) ease forwards; }
  .slide-enter-up { opacity: 0; transform: translateY(100px); animation: slideInU var(--dur, 0.5s) ease forwards; }
  .slide-enter-down { opacity: 0; transform: translateY(-100px); animation: slideInD var(--dur, 0.5s) ease forwards; }
  .zoom-enter { opacity: 0; transform: scale(0.8); animation: zoomIn var(--dur, 0.5s) ease forwards; }
  .flip-enter { opacity: 0; transform: rotateY(-90deg); animation: flipIn var(--dur, 0.5s) ease forwards; }
  @keyframes fadeIn { to { opacity: 1; } }
  @keyframes slideInL { to { opacity: 1; transform: translateX(0); } }
  @keyframes slideInR { to { opacity: 1; transform: translateX(0); } }
  @keyframes slideInU { to { opacity: 1; transform: translateY(0); } }
  @keyframes slideInD { to { opacity: 1; transform: translateY(0); } }
  @keyframes zoomIn { to { opacity: 1; transform: scale(1); } }
  @keyframes flipIn { to { opacity: 1; transform: rotateY(0); } }
  .stagger > * { opacity: 0; }
  .stagger.animate > * { animation: fadeBlock 0.5s ease forwards; }
  @keyframes fadeBlock { to { opacity: 1; transform: translateY(0); } }
  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
  ::-webkit-scrollbar-thumb { background: rgba(167,139,250,0.4); border-radius: 4px; }
</style>
</head>
<body>
<div id="app"></div>
<script>
const PROJECT = ${projectJson};
let currentId = PROJECT.rootChapterId;
let historyStack = [];
let bgAudio = null;
let chapterAudio = null;
let visited = new Set();

const getAnimClass = (t) => {
  if (!t) return "fade-enter";
  const d = (t.duration || 0.5) + "s";
  if (t.type === "slide") {
    const dir = t.direction || "left";
    const cls = "slide-enter-" + dir;
    return cls + '; --dur: ' + d;
  }
  if (t.type === "zoom") return "zoom-enter; --dur: " + d;
  if (t.type === "flip") return "flip-enter; --dur: " + d;
  return "fade-enter; --dur: " + d;
};

const startBgSound = () => {
  if (!PROJECT.bgSoundUrl) return;
  try {
    bgAudio = new Audio(PROJECT.bgSoundUrl);
    bgAudio.loop = true;
    bgAudio.volume = 0.3;
    bgAudio.play().catch(()=>{});
  } catch(e) {}
};

const playChapterMusic = (url) => {
  if (chapterAudio) { chapterAudio.pause(); chapterAudio = null; }
  if (!url) return;
  try {
    chapterAudio = new Audio(url);
    chapterAudio.loop = true;
    chapterAudio.volume = 0.5;
    chapterAudio.play().catch(()=>{});
  } catch(e) {}
};

const goToChapter = (id) => {
  if (!id) return;
  historyStack.push(currentId);
  currentId = id;
  visited.add(id);
  render();
};

const goBack = () => {
  if (historyStack.length === 0) return;
  currentId = historyStack.pop();
  render();
};

const restart = () => {
  currentId = PROJECT.rootChapterId;
  historyStack = [];
  visited = new Set([currentId]);
  render();
};

const escapeHtml = (s) => {
  const div = document.createElement('div');
  div.textContent = s || '';
  return div.innerHTML;
};

const render = () => {
  const chapter = PROJECT.chapters[currentId];
  if (!chapter) return;
  playChapterMusic(chapter.bgMusicUrl);
  const animParts = getAnimClass(chapter.transition).split('; ');
  const animClass = animParts[0];
  const durVar = animParts[1] || '';
  const bgStyle = chapter.bgImageUrl
    ? 'background-image: url(' + chapter.bgImageUrl + ');'
    : '';
  const overlayStyle = chapter.bgImageUrl
    ? 'background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);'
    : '';

  let blocksHtml = '';
  chapter.blocks.forEach((block, idx) => {
    const delay = (0.2 + idx * 0.1).toFixed(2) + 's';
    const style = 'animation-delay: ' + delay + '; transform: translateY(20px);';
    if (block.type === "text") {
      blocksHtml += '<p class="text-lg text-white/90 leading-relaxed whitespace-pre-wrap stagger-item" style="' + style + '">' + escapeHtml(block.content) + '</p>';
    } else if (block.type === "image" && block.content) {
      blocksHtml += '<img src="' + escapeHtml(block.content) + '" class="w-full rounded-2xl shadow-2xl max-h-96 object-cover stagger-item" style="' + style + '" onerror="this.style.display=\\'none\\'" />';
    } else if (block.type === "video" && block.content) {
      blocksHtml += '<video src="' + escapeHtml(block.content) + '" controls class="w-full rounded-2xl shadow-2xl stagger-item" style="' + style + '"></video>';
    } else if (block.type === "choice" && block.choices) {
      let choicesHtml = '';
      block.choices.forEach((choice, cIdx) => {
        const letter = String.fromCharCode(65 + cIdx);
        choicesHtml += '<button onclick="goToChapter(\\'' + (choice.nextChapterId || '') + '\\')" class="choice-btn w-full text-left p-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white stagger-item" style="' + (style + ' animation-delay: ' + (0.3 + idx * 0.1 + cIdx * 0.05).toFixed(2) + 's') + '"><div class="flex items-center gap-3"><div class="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-sm font-bold shrink-0">' + letter + '</div><span class="text-lg font-medium">' + escapeHtml(choice.label) + '</span></div></button>';
      });
      blocksHtml += '<div class="space-y-3 mt-8">' + choicesHtml + '</div>';
    }
  });

  const hasChoice = chapter.blocks.some(b => b.type === 'choice');
  const endHtml = hasChoice ? '' : '<div class="mt-12 text-center text-white/60 italic stagger-item" style="animation-delay: ' + (0.5 + chapter.blocks.length * 0.1).toFixed(2) + 's">— 本章结束 —</div>';

  const backBtn = historyStack.length > 0
    ? '<button onclick="goBack()" class="mb-6 flex items-center gap-2 text-white/70 hover:text-white transition-colors"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg><span>返回上一章</span></button>'
    : '';

  const app = document.getElementById('app');
  app.innerHTML = '<div class="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent"><div class="flex items-center gap-3"><div class="p-2 rounded-xl bg-white/10 backdrop-blur-sm"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" class="text-white"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg></div><div><div class="text-white font-semibold">' + escapeHtml(PROJECT.title) + '</div><div class="text-white/60 text-xs">进度: ' + visited.size + '/' + Object.keys(PROJECT.chapters).length + ' 章</div></div></div><div class="flex items-center gap-2"><button onclick="restart()" class="p-2 rounded-lg bg-white/10 backdrop-blur-sm text-white/70 hover:bg-white/20 hover:text-white transition-all" title="重新开始"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg></button></div></div><div class="story-bg ' + animClass + '" style="' + bgStyle + (durVar ? '; ' + durVar.replace('--dur:', '--dur:') : '') + '; perspective: 1000px;"><div class="min-h-screen" style="' + overlayStyle + '"><div class="max-w-3xl mx-auto px-6 py-20">' + backBtn + '<h1 class="text-4xl font-bold text-white mb-2 stagger-item" style="animation-delay: 0.1s; transform: translateY(20px);">' + escapeHtml(chapter.title) + '</h1><div class="space-y-6 mt-10 stagger animate">' + blocksHtml + endHtml + '</div></div></div></div>';

  requestAnimationFrame(() => {
    document.querySelectorAll('.stagger-item').forEach((el, i) => {
      el.style.animation = 'fadeBlock 0.5s ease forwards';
    });
  });
};

document.addEventListener('click', function once() {
  startBgSound();
  document.removeEventListener('click', once);
}, { once: true });

render();
</script>
<div class="fixed bottom-4 right-4 text-xs text-white/40">
  导出时间: ${buildDate}
</div>
</body>
</html>`;
};

export default function Toolbar() {
  const {
    project,
    updateProjectTitle,
    updateProjectDescription,
    updateBgSound,
    togglePreviewMode,
    resetProject,
    loadProject,
  } = useStoryStore();

  const [showMenu, setShowMenu] = useState(false);
  const [exportModal, setExportModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  const handleExport = () => {
    const html = generateStaticHTML(project);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title || "story"}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(project, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title || "story"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyHTML = async () => {
    const html = generateStaticHTML(project);
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.id && data.chapters) {
          loadProject(data);
        }
      } catch (err) {
        alert("文件格式不正确");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleReset = () => {
    if (confirm("确定要重置项目吗？所有内容将丢失。")) {
      resetProject();
    }
  };

  return (
    <>
      <header className="h-16 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 flex items-center px-4 gap-4 shrink-0">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-500/30"
        >
          <PenTool size={18} className="text-white" />
        </motion.div>

        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={project.title}
            onChange={(e) => updateProjectTitle(e.target.value)}
            className="w-full bg-transparent text-lg font-bold text-white placeholder-slate-500 focus:outline-none"
            placeholder="故事标题..."
          />
          <input
            type="text"
            value={project.description}
            onChange={(e) => updateProjectDescription(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-400 placeholder-slate-600 focus:outline-none"
            placeholder="故事描述..."
          />
        </div>

        <div className="flex items-center gap-1.5">
          <div className="hidden md:flex items-center gap-1.5 mr-2">
            <Clock size={12} className="text-slate-500" />
            <span className="text-xs text-slate-500">
              {new Date(project.updatedAt).toLocaleTimeString("zh-CN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span className="text-xs text-emerald-400 flex items-center gap-1 ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              已保存
            </span>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all text-sm"
            >
              <Save size={15} />
              <span className="hidden sm:inline">项目</span>
            </button>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                onClick={() => setShowMenu(false)}
                className="absolute right-0 top-full mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-2xl z-50"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExportJSON();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-slate-700 transition-colors"
                >
                  <Download size={16} className="text-sky-400" />
                  导出为 JSON
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-slate-700 transition-colors"
                >
                  <Upload size={16} className="text-emerald-400" />
                  导入 JSON 项目
                </button>
                <div className="border-t border-slate-700" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReset();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Sparkles size={16} />
                  重置为示例项目
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImport}
                  className="hidden"
                />
              </motion.div>
            )}
          </div>

          <div className="relative group">
            <button
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all text-sm"
              title="全局背景音效"
            >
              <Volume2 size={15} />
            </button>
            <div className="absolute right-0 top-full mt-2 w-72 bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-2xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <label className="text-xs font-medium text-slate-400 block mb-2">
                全局背景音效 URL
              </label>
              <input
                type="url"
                value={project.bgSoundUrl || ""}
                onChange={(e) =>
                  updateBgSound(e.target.value || undefined)
                }
                placeholder="可选：循环播放的背景音效..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
              {project.bgSoundUrl && (
                <audio src={project.bgSoundUrl} controls className="mt-3 w-full h-8" />
              )}
            </div>
          </div>

          <button
            onClick={() => setExportModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 text-white hover:from-cyan-500 hover:to-sky-500 transition-all text-sm font-medium shadow-lg shadow-cyan-500/20"
          >
            <Download size={15} />
            <span className="hidden sm:inline">导出网页</span>
          </button>

          <button
            onClick={togglePreviewMode}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-500 hover:to-purple-500 transition-all text-sm font-medium shadow-lg shadow-violet-500/30"
          >
            <Play size={15} fill="currentColor" />
            <span className="hidden sm:inline">预览故事</span>
          </button>
        </div>
      </header>

      {exportModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setExportModal(false)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Download className="text-violet-400" size={22} />
              导出静态网页
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              将故事导出为独立的 HTML 文件，可部署到任何静态网站托管服务（如 Vercel、Netlify、GitHub Pages 等），无需任何后端。
            </p>
            <div className="space-y-3">
              <button
                onClick={handleExport}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-500 hover:to-purple-500 transition-all font-medium"
              >
                <Download size={18} />
                下载 HTML 文件
              </button>
              <button
                onClick={handleCopyHTML}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all"
              >
                {copied ? "✓ 已复制" : "复制 HTML 代码"}
              </button>
            </div>
            <button
              onClick={() => setExportModal(false)}
              className="mt-4 w-full py-2 text-slate-500 hover:text-slate-300 transition-colors text-sm"
            >
              取消
            </button>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
