import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  StoryProject,
  StoryState,
  Chapter,
  StoryBlock,
  BlockType,
  TransitionConfig,
  ChoiceOption,
} from "@/types/story";

const STORAGE_KEY = "interactive-story-project";

const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

const createDefaultProject = (): StoryProject => {
  const rootChapterId = generateId();
  return {
    id: generateId(),
    title: "我的交互式故事",
    description: "在这里开始你的创作之旅...",
    rootChapterId,
    chapters: {
      [rootChapterId]: {
        id: rootChapterId,
        title: "第一章：开端",
        blocks: [
          {
            id: generateId(),
            type: "text",
            content: "这是一个奇妙的冒险故事的开始...",
          },
        ],
        transition: { type: "fade", duration: 0.5 },
        parentId: null,
      },
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
};

interface StoryStore extends StoryState {
  setProject: (project: StoryProject) => void;
  updateProjectTitle: (title: string) => void;
  updateProjectDescription: (description: string) => void;
  updateBgSound: (url: string | undefined) => void;

  selectChapter: (chapterId: string | null) => void;
  selectBlock: (blockId: string | null) => void;

  addChapter: (parentId: string | null, optionLabel?: string, autoSelect?: boolean) => Chapter;
  updateChapter: (chapterId: string, updates: Partial<Chapter>) => void;
  deleteChapter: (chapterId: string) => void;
  duplicateChapter: (chapterId: string) => Chapter | null;

  addBlock: (chapterId: string, type: BlockType) => StoryBlock;
  updateBlock: (
    chapterId: string,
    blockId: string,
    updates: Partial<StoryBlock>
  ) => void;
  deleteBlock: (chapterId: string, blockId: string) => void;
  moveBlock: (
    chapterId: string,
    blockId: string,
    direction: "up" | "down"
  ) => void;

  updateTransition: (chapterId: string, transition: TransitionConfig) => void;
  updateChapterBgMusic: (chapterId: string, url: string | undefined) => void;
  updateChapterBgImage: (chapterId: string, url: string | undefined) => void;

  addChoice: (chapterId: string, blockId: string) => ChoiceOption;
  updateChoice: (
    chapterId: string,
    blockId: string,
    choiceId: string,
    updates: Partial<ChoiceOption>
  ) => void;
  deleteChoice: (chapterId: string, blockId: string, choiceId: string) => void;

  togglePreviewMode: () => void;
  setPreviewChapter: (chapterId: string | null) => void;
  addVisitedChapter: (chapterId: string) => void;
  resetPreview: () => void;

  resetProject: () => void;
  loadProject: (project: StoryProject) => void;
}

const defaultProject = createDefaultProject();

export const useStoryStore = create<StoryStore>()(
  persist(
    (set, get) => ({
      project: defaultProject,
      selectedChapterId: defaultProject.rootChapterId,
      selectedBlockId: null,
      isPreviewMode: false,
      currentPreviewChapterId: null,
      visitedChapters: defaultProject.rootChapterId
        ? [defaultProject.rootChapterId]
        : [],

      setProject: (project) =>
        set({ project: { ...project, updatedAt: Date.now() } }),

      updateProjectTitle: (title) =>
        set((s) => ({
          project: { ...s.project, title, updatedAt: Date.now() },
        })),

      updateProjectDescription: (description) =>
        set((s) => ({
          project: { ...s.project, description, updatedAt: Date.now() },
        })),

      updateBgSound: (url) =>
        set((s) => ({
          project: {
            ...s.project,
            bgSoundUrl: url,
            updatedAt: Date.now(),
          },
        })),

      selectChapter: (chapterId) =>
        set({ selectedChapterId: chapterId, selectedBlockId: null }),

      selectBlock: (blockId) => set({ selectedBlockId: blockId }),

      addChapter: (parentId, optionLabel, autoSelect = true) => {
        const newChapter: Chapter = {
          id: generateId(),
          title: optionLabel ? `分支：${optionLabel}` : "新章节",
          blocks: [
            { id: generateId(), type: "text", content: "开始编写内容..." },
          ],
          transition: { type: "fade", duration: 0.5 },
          parentId,
        };
        set((s) => ({
          project: {
            ...s.project,
            chapters: { ...s.project.chapters, [newChapter.id]: newChapter },
            updatedAt: Date.now(),
          },
          selectedChapterId: autoSelect ? newChapter.id : s.selectedChapterId,
        }));
        return newChapter;
      },

      updateChapter: (chapterId, updates) =>
        set((s) => ({
          project: {
            ...s.project,
            chapters: {
              ...s.project.chapters,
              [chapterId]: {
                ...s.project.chapters[chapterId],
                ...updates,
              },
            },
            updatedAt: Date.now(),
          },
        })),

      deleteChapter: (chapterId) => {
        set((s) => {
          const { [chapterId]: removed, ...restChapters } = s.project.chapters;
          const chapters = { ...restChapters };

          Object.values(chapters).forEach((ch) => {
            ch.blocks.forEach((block) => {
              if (block.choices) {
                block.choices = block.choices.map((c) =>
                  c.nextChapterId === chapterId
                    ? { ...c, nextChapterId: null }
                    : c
                );
              }
            });
          });

          const toDelete = new Set<string>();
          const collectChildren = (id: string) => {
            Object.values(chapters).forEach((ch) => {
              if (ch.parentId === id && !toDelete.has(ch.id)) {
                toDelete.add(ch.id);
                collectChildren(ch.id);
              }
            });
          };
          collectChildren(chapterId);
          toDelete.forEach((id) => delete chapters[id]);

          const isRoot = s.project.rootChapterId === chapterId;
          const remainingIds = Object.keys(chapters);
          const newRoot = isRoot
            ? remainingIds.length > 0
              ? remainingIds[0]
              : null
            : s.project.rootChapterId;

          return {
            project: {
              ...s.project,
              chapters,
              rootChapterId: newRoot,
              updatedAt: Date.now(),
            },
            selectedChapterId:
              s.selectedChapterId === chapterId ? null : s.selectedChapterId,
          };
        });
      },

      duplicateChapter: (chapterId) => {
        const original = get().project.chapters[chapterId];
        if (!original) return null;
        const newId = generateId();
        const duplicated: Chapter = {
          ...original,
          id: newId,
          title: `${original.title} (副本)`,
          blocks: original.blocks.map((b) => ({
            ...b,
            id: generateId(),
            choices: b.choices?.map((c) => ({ ...c, id: generateId() })),
          })),
        };
        set((s) => ({
          project: {
            ...s.project,
            chapters: { ...s.project.chapters, [newId]: duplicated },
            updatedAt: Date.now(),
          },
          selectedChapterId: newId,
        }));
        return duplicated;
      },

      addBlock: (chapterId, type) => {
        const block: StoryBlock = {
          id: generateId(),
          type,
          content: type === "text" ? "" : "",
          choices: type === "choice" ? [generateId(), generateId()].map((id) => ({
            id,
            label: "选项",
            nextChapterId: null,
          })) : undefined,
        };
        set((s) => ({
          project: {
            ...s.project,
            chapters: {
              ...s.project.chapters,
              [chapterId]: {
                ...s.project.chapters[chapterId],
                blocks: [...s.project.chapters[chapterId].blocks, block],
              },
            },
            updatedAt: Date.now(),
          },
          selectedBlockId: block.id,
        }));
        return block;
      },

      updateBlock: (chapterId, blockId, updates) =>
        set((s) => ({
          project: {
            ...s.project,
            chapters: {
              ...s.project.chapters,
              [chapterId]: {
                ...s.project.chapters[chapterId],
                blocks: s.project.chapters[chapterId].blocks.map((b) =>
                  b.id === blockId ? { ...b, ...updates } : b
                ),
              },
            },
            updatedAt: Date.now(),
          },
        })),

      deleteBlock: (chapterId, blockId) =>
        set((s) => ({
          project: {
            ...s.project,
            chapters: {
              ...s.project.chapters,
              [chapterId]: {
                ...s.project.chapters[chapterId],
                blocks: s.project.chapters[chapterId].blocks.filter(
                  (b) => b.id !== blockId
                ),
              },
            },
            updatedAt: Date.now(),
          },
          selectedBlockId:
            s.selectedBlockId === blockId ? null : s.selectedBlockId,
        })),

      moveBlock: (chapterId, blockId, direction) => {
        set((s) => {
          const blocks = [...s.project.chapters[chapterId].blocks];
          const idx = blocks.findIndex((b) => b.id === blockId);
          if (idx === -1) return {};
          const targetIdx = direction === "up" ? idx - 1 : idx + 1;
          if (targetIdx < 0 || targetIdx >= blocks.length) return {};
          [blocks[idx], blocks[targetIdx]] = [blocks[targetIdx], blocks[idx]];
          return {
            project: {
              ...s.project,
              chapters: {
                ...s.project.chapters,
                [chapterId]: {
                  ...s.project.chapters[chapterId],
                  blocks,
                },
              },
              updatedAt: Date.now(),
            },
          };
        });
      },

      updateTransition: (chapterId, transition) =>
        set((s) => ({
          project: {
            ...s.project,
            chapters: {
              ...s.project.chapters,
              [chapterId]: {
                ...s.project.chapters[chapterId],
                transition,
              },
            },
            updatedAt: Date.now(),
          },
        })),

      updateChapterBgMusic: (chapterId, url) =>
        set((s) => ({
          project: {
            ...s.project,
            chapters: {
              ...s.project.chapters,
              [chapterId]: {
                ...s.project.chapters[chapterId],
                bgMusicUrl: url,
              },
            },
            updatedAt: Date.now(),
          },
        })),

      updateChapterBgImage: (chapterId, url) =>
        set((s) => ({
          project: {
            ...s.project,
            chapters: {
              ...s.project.chapters,
              [chapterId]: {
                ...s.project.chapters[chapterId],
                bgImageUrl: url,
              },
            },
            updatedAt: Date.now(),
          },
        })),

      addChoice: (chapterId, blockId) => {
        const choice: ChoiceOption = {
          id: generateId(),
          label: "新选项",
          nextChapterId: null,
        };
        set((s) => ({
          project: {
            ...s.project,
            chapters: {
              ...s.project.chapters,
              [chapterId]: {
                ...s.project.chapters[chapterId],
                blocks: s.project.chapters[chapterId].blocks.map((b) =>
                  b.id === blockId
                    ? {
                        ...b,
                        choices: [...(b.choices || []), choice],
                      }
                    : b
                ),
              },
            },
            updatedAt: Date.now(),
          },
        }));
        return choice;
      },

      updateChoice: (chapterId, blockId, choiceId, updates) =>
        set((s) => ({
          project: {
            ...s.project,
            chapters: {
              ...s.project.chapters,
              [chapterId]: {
                ...s.project.chapters[chapterId],
                blocks: s.project.chapters[chapterId].blocks.map((b) =>
                  b.id === blockId
                    ? {
                        ...b,
                        choices: b.choices?.map((c) =>
                          c.id === choiceId ? { ...c, ...updates } : c
                        ),
                      }
                    : b
                ),
              },
            },
            updatedAt: Date.now(),
          },
        })),

      deleteChoice: (chapterId, blockId, choiceId) =>
        set((s) => ({
          project: {
            ...s.project,
            chapters: {
              ...s.project.chapters,
              [chapterId]: {
                ...s.project.chapters[chapterId],
                blocks: s.project.chapters[chapterId].blocks.map((b) =>
                  b.id === blockId
                    ? {
                        ...b,
                        choices: b.choices?.filter((c) => c.id !== choiceId),
                      }
                    : b
                ),
              },
            },
            updatedAt: Date.now(),
          },
        })),

      togglePreviewMode: () =>
        set((s) => ({
          isPreviewMode: !s.isPreviewMode,
          currentPreviewChapterId: !s.isPreviewMode
            ? s.project.rootChapterId
            : null,
          visitedChapters: !s.isPreviewMode
            ? s.project.rootChapterId
              ? [s.project.rootChapterId]
              : []
            : [],
        })),

      setPreviewChapter: (chapterId) =>
        set((s) => ({
          currentPreviewChapterId: chapterId,
          visitedChapters:
            chapterId && !s.visitedChapters.includes(chapterId)
              ? [...s.visitedChapters, chapterId]
              : s.visitedChapters,
        })),

      addVisitedChapter: (chapterId) =>
        set((s) =>
          s.visitedChapters.includes(chapterId)
            ? {}
            : { visitedChapters: [...s.visitedChapters, chapterId] }
        ),

      resetPreview: () =>
        set((s) => ({
          currentPreviewChapterId: s.project.rootChapterId,
          visitedChapters: s.project.rootChapterId
            ? [s.project.rootChapterId]
            : [],
        })),

      resetProject: () => {
        const newProject = createDefaultProject();
        set({
          project: newProject,
          selectedChapterId: newProject.rootChapterId,
          selectedBlockId: null,
          isPreviewMode: false,
          currentPreviewChapterId: null,
          visitedChapters: newProject.rootChapterId
            ? [newProject.rootChapterId]
            : [],
        });
      },

      loadProject: (project) => {
        set({
          project,
          selectedChapterId: project.rootChapterId,
          selectedBlockId: null,
          isPreviewMode: false,
          currentPreviewChapterId: null,
          visitedChapters: project.rootChapterId ? [project.rootChapterId] : [],
        });
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        project: state.project,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error || !state || !state.project || !state.project.chapters) {
          const fallback = createDefaultProject();
          state?.setProject?.(fallback);
          if (state) {
            state.selectedChapterId = fallback.rootChapterId;
            state.visitedChapters = fallback.rootChapterId
              ? [fallback.rootChapterId]
              : [];
          }
          return;
        }
        const validId =
          state.project.rootChapterId &&
          state.project.chapters[state.project.rootChapterId];
        if (
          validId &&
          (!state.selectedChapterId ||
            !state.project.chapters[state.selectedChapterId])
        ) {
          state.selectedChapterId = state.project.rootChapterId;
          state.visitedChapters = [state.project.rootChapterId];
        }
      },
    }
  )
);
