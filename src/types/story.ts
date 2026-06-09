export type TransitionType = "fade" | "slide" | "zoom" | "flip";

export interface TransitionConfig {
  type: TransitionType;
  duration: number;
  direction?: "left" | "right" | "up" | "down";
}

export type BlockType = "text" | "image" | "video" | "choice";

export interface ChoiceOption {
  id: string;
  label: string;
  nextChapterId: string | null;
}

export interface StoryBlock {
  id: string;
  type: BlockType;
  content: string;
  choices?: ChoiceOption[];
}

export interface Chapter {
  id: string;
  title: string;
  blocks: StoryBlock[];
  transition: TransitionConfig;
  bgMusicUrl?: string;
  bgImageUrl?: string;
  parentId: string | null;
}

export interface StoryProject {
  id: string;
  title: string;
  description: string;
  rootChapterId: string | null;
  chapters: Record<string, Chapter>;
  bgSoundUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export interface StoryState {
  project: StoryProject;
  selectedChapterId: string | null;
  selectedBlockId: string | null;
  isPreviewMode: boolean;
  currentPreviewChapterId: string | null;
  visitedChapters: string[];
}
