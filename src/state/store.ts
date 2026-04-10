import { create } from "zustand";
import { seedPrompts } from "../data/seedPrompts";
import type { FavoriteItem, Message, Prompt, PromptStatus, PromptVersion } from "../types";
import { getLatestVersion, getNextVersionNumber } from "../promptBank/versioning";
import { readJSON, writeJSON } from "./persist";

const STORAGE_KEYS = {
  libraryCollapsed: "promptBank.libraryCollapsed",
  favorites: "promptBank.favorites",
  usageCounts: "promptBank.usageCounts",
  leftShellMode: "shell.leftShellMode",
} as const;

const createId = () => crypto.randomUUID();

type FilterMode = "all" | "favorites" | "featured";
type LibraryView = "browse" | "detail";
export type SortMode = "popular" | "trending" | "latest";
export type LeftShellMode = "expanded" | "rail";
export type AppMode = "chat" | "promptManager";
export type PromptManagerView = "list" | "editor";
export type PromptManagerStatusFilter = "all" | "draft" | "published" | "archived";

export type PromptDraftPayload = {
  title: string;
  description?: string;
  desiredOutcome?: string;
  tags?: string[];
  content: string;
};

export type NewVersionPayload = {
  description?: string;
  desiredOutcome?: string;
  content: string;
};

type StoreState = {
  // Shell
  leftShellMode: LeftShellMode;
  toggleLeftShell: () => void;

  // App mode
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  openPromptManager: () => void;
  closePromptManager: () => void;

  // Library state
  libraryCollapsed: boolean;
  libraryView: LibraryView;
  prompts: Prompt[];
  promptQuery: string;
  selectedPromptId: string | null;
  detailInitialVersionNumber: number | null;
  favorites: FavoriteItem[];
  filterMode: FilterMode;
  sortMode: SortMode;
  usageCounts: Record<string, number>;

  // Chat state
  messages: Message[];
  composerText: string;
  composerFocusSignal: number;
  hasAttachedFile: boolean;
  requiresAttachment: boolean;
  composerError: string | null;

  // Prompt Manager UI state
  selectedManagedPromptId: string | null;
  promptManagerView: PromptManagerView;
  promptManagerSearch: string;
  promptManagerStatusFilter: PromptManagerStatusFilter;

  // Library actions
  setLibraryCollapsed: (next: boolean) => void;
  toggleLibraryCollapsed: () => void;
  setPromptQuery: (q: string) => void;
  openPromptDetail: (id: string, initialVersionNumber?: number) => void;
  closePromptDetail: () => void;
  isPromptFavorited: (promptId: string) => boolean;
  isVersionFavorited: (promptId: string, version: number) => boolean;
  togglePromptFavorite: (promptId: string) => void;
  toggleVersionFavorite: (promptId: string, version: number) => void;
  setFilterMode: (mode: FilterMode) => void;
  setSortMode: (mode: SortMode) => void;
  incrementUsage: (id: string) => void;

  // Composer actions
  setComposerText: (text: string) => void;
  insertIntoComposer: (text: string, options?: { requiresAttachment?: boolean }) => void;
  setHasAttachedFile: (value: boolean) => void;
  setRequiresAttachment: (value: boolean) => void;
  clearAttachmentRequirement: () => void;
  clearComposerError: () => void;
  sendMessage: () => void;

  // Prompt Manager actions
  selectManagedPrompt: (promptId: string | null) => void;
  startNewPromptDraft: () => void;
  savePromptDraft: (promptId: string, payload: PromptDraftPayload) => void;
  publishPrompt: (promptId: string, payload: PromptDraftPayload) => void;
  unpublishPrompt: (promptId: string) => void;
  archivePrompt: (promptId: string) => void;
  restorePrompt: (promptId: string) => void;
  savePromptAsNewVersion: (promptId: string, payload: NewVersionPayload) => void;
  setPromptManagerSearch: (search: string) => void;
  setPromptManagerStatusFilter: (filter: PromptManagerStatusFilter) => void;
};

const normalizeFavorite = (favorite: FavoriteItem): FavoriteItem => ({
  ...favorite,
  id: favorite.version == null ? `${favorite.promptId}:latest` : `${favorite.promptId}:v${favorite.version}`,
  createdAt: favorite.createdAt ?? new Date().toISOString(),
});

const readFavorites = (): FavoriteItem[] => {
  const stored = readJSON<FavoriteItem[] | string[]>(STORAGE_KEYS.favorites, []);

  if (!Array.isArray(stored)) return [];
  if (stored.length === 0) return [];

  if (typeof stored[0] === "string") {
    const now = new Date().toISOString();
    return (stored as string[]).map((promptId) => ({ id: `${promptId}:latest`, promptId, createdAt: now }));
  }

  return (stored as FavoriteItem[]).map((favorite) => normalizeFavorite(favorite));
};

const readLibraryCollapsed = (): boolean => readJSON<boolean>(STORAGE_KEYS.libraryCollapsed, true);

const readLeftShellMode = (): LeftShellMode => readJSON<LeftShellMode>(STORAGE_KEYS.leftShellMode, "expanded");

const readUsageCounts = (): Record<string, number> => readJSON<Record<string, number>>(STORAGE_KEYS.usageCounts, {});

const initialFavorites = readFavorites();
const initialUsageCounts = readUsageCounts();

export const useStore = create<StoreState>((set, get) => ({
  leftShellMode: readLeftShellMode(),

  toggleLeftShell: () => {
    const next: LeftShellMode = get().leftShellMode === "expanded" ? "rail" : "expanded";
    writeJSON(STORAGE_KEYS.leftShellMode, next);
    set({ leftShellMode: next });
  },

  // App mode
  appMode: "chat",
  setAppMode: (mode) => set({ appMode: mode }),
  openPromptManager: () => set({ appMode: "promptManager" }),
  closePromptManager: () => set({ appMode: "chat" }),

  // Library state
  libraryCollapsed: readLibraryCollapsed(),
  libraryView: "browse",
  prompts: seedPrompts,
  promptQuery: "",
  selectedPromptId: null,
  detailInitialVersionNumber: null,
  favorites: initialFavorites,
  filterMode: "all",
  sortMode: "popular",
  usageCounts: initialUsageCounts,

  // Chat state
  messages: [],
  composerText: "",
  composerFocusSignal: 0,
  hasAttachedFile: false,
  requiresAttachment: false,
  composerError: null,

  // Prompt Manager UI state
  selectedManagedPromptId: null,
  promptManagerView: "list",
  promptManagerSearch: "",
  promptManagerStatusFilter: "all",

  // Library actions
  setLibraryCollapsed: (next) => {
    writeJSON(STORAGE_KEYS.libraryCollapsed, next);
    set({ libraryCollapsed: next });
  },

  toggleLibraryCollapsed: () => {
    const next = !get().libraryCollapsed;
    writeJSON(STORAGE_KEYS.libraryCollapsed, next);
    set({ libraryCollapsed: next });
  },

  setPromptQuery: (q) => set({ promptQuery: q }),

  openPromptDetail: (id, initialVersionNumber) =>
    set({ selectedPromptId: id, libraryView: "detail", detailInitialVersionNumber: initialVersionNumber ?? null }),

  closePromptDetail: () => set({ libraryView: "browse", detailInitialVersionNumber: null }),

  isPromptFavorited: (promptId) => get().favorites.some((favorite) => favorite.promptId === promptId && favorite.version == null),

  isVersionFavorited: (promptId, version) =>
    get().favorites.some((favorite) => favorite.promptId === promptId && favorite.version === version),

  togglePromptFavorite: (promptId) => {
    const promptFavoriteId = `${promptId}:latest`;
    const exists = get().favorites.some((favorite) => favorite.id === promptFavoriteId);
    const nextFavorites = exists
      ? get().favorites.filter((favorite) => favorite.id !== promptFavoriteId)
      : [...get().favorites, { id: promptFavoriteId, promptId, createdAt: new Date().toISOString() }];

    writeJSON(STORAGE_KEYS.favorites, nextFavorites);
    set({ favorites: nextFavorites });
  },

  toggleVersionFavorite: (promptId, version) => {
    const versionFavoriteId = `${promptId}:v${version}`;
    const exists = get().favorites.some((favorite) => favorite.id === versionFavoriteId);
    const nextFavorites = exists
      ? get().favorites.filter((favorite) => favorite.id !== versionFavoriteId)
      : [...get().favorites, { id: versionFavoriteId, promptId, version, createdAt: new Date().toISOString() }];

    writeJSON(STORAGE_KEYS.favorites, nextFavorites);
    set({ favorites: nextFavorites });
  },

  setFilterMode: (mode) => set({ filterMode: mode }),

  setSortMode: (mode) => set({ sortMode: mode }),

  incrementUsage: (id) => {
    const nextUsage = {
      ...get().usageCounts,
      [id]: (get().usageCounts[id] ?? 0) + 1,
    };
    writeJSON(STORAGE_KEYS.usageCounts, nextUsage);
    set({ usageCounts: nextUsage });
  },

  // Composer actions
  setComposerText: (text) => set({
    composerText: text,
    requiresAttachment: text.trim().length === 0 ? false : get().requiresAttachment,
    composerError: null,
  }),

  insertIntoComposer: (text, options) => {
    const current = get().composerText;
    const merged = current.trim().length > 0 ? `${current}\n${text}` : text;

    set((state) => ({
      composerText: merged,
      composerFocusSignal: state.composerFocusSignal + 1,
      requiresAttachment: options?.requiresAttachment ?? false,
      composerError: null,
    }));
  },

  setHasAttachedFile: (value) => set({ hasAttachedFile: value, composerError: value ? null : get().composerError }),

  setRequiresAttachment: (value) => set({ requiresAttachment: value }),

  clearAttachmentRequirement: () => set({ requiresAttachment: false }),

  clearComposerError: () => set({ composerError: null }),

  sendMessage: () => {
    const text = get().composerText.trim();
    if (!text) return;

    if (get().requiresAttachment && !get().hasAttachedFile) {
      set({ composerError: "Attach a file before sending this prompt." });
      return;
    }

    const userMessage: Message = {
      id: createId(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      composerText: "",
      requiresAttachment: false,
      composerError: null,
    }));

    const timeout = 300 + Math.floor(Math.random() * 301);
    window.setTimeout(() => {
      const assistantMessage: Message = {
        id: createId(),
        role: "assistant",
        content: "Mock reply: Thanks — I received your message and can help refine it further.",
        createdAt: new Date().toISOString(),
      };

      set((state) => ({ messages: [...state.messages, assistantMessage] }));
    }, timeout);
  },

  // Prompt Manager actions
  selectManagedPrompt: (promptId) => set({
    selectedManagedPromptId: promptId,
    promptManagerView: promptId !== null ? "editor" : "list",
  }),

  startNewPromptDraft: () => {
    const id = createId();
    const now = new Date().toISOString();
    const newPrompt: Prompt = {
      id,
      title: "Untitled Prompt",
      description: "",
      desiredOutcome: "",
      category: "General",
      tags: [],
      content: "",
      likes: 0,
      createdAt: now,
      lastUpdatedAt: now,
      owner: "User",
      media: false,
      status: "draft",
      publishedVersionId: null,
      hasUnpublishedChanges: false,
    };

    set((state) => ({
      prompts: [...state.prompts, newPrompt],
      selectedManagedPromptId: id,
      promptManagerView: "editor",
    }));
  },

  savePromptDraft: (promptId, payload) => {
    const now = new Date().toISOString();
    set((state) => ({
      prompts: state.prompts.map((p) => {
        if (p.id !== promptId) return p;
        return {
          ...p,
          title: payload.title,
          description: payload.description,
          desiredOutcome: payload.desiredOutcome,
          tags: payload.tags ?? p.tags,
          content: payload.content,
          lastUpdatedAt: now,
          hasUnpublishedChanges: p.status === "published" ? true : p.hasUnpublishedChanges,
        };
      }),
    }));
  },

  publishPrompt: (promptId, payload) => {
    const now = new Date().toISOString();
    set((state) => {
      const prompt = state.prompts.find((p) => p.id === promptId);
      if (!prompt) return state;

      // Build a new version snapshot from the payload
      const nextVersionNumber = getNextVersionNumber(prompt);
      const newVersion: PromptVersion = {
        id: `${promptId}-v${nextVersionNumber}`,
        version: nextVersionNumber,
        createdAt: now,
        description: payload.description,
        desiredOutcome: payload.desiredOutcome,
        content: payload.content,
      };

      const existingVersions = prompt.versions ?? [];
      const updatedVersions = [...existingVersions, newVersion];

      return {
        prompts: state.prompts.map((p) => {
          if (p.id !== promptId) return p;
          return {
            ...p,
            title: payload.title,
            description: payload.description,
            desiredOutcome: payload.desiredOutcome,
            tags: payload.tags ?? p.tags,
            content: payload.content,
            versions: updatedVersions,
            status: "published" as PromptStatus,
            publishedVersionId: newVersion.id,
            lastUpdatedAt: now,
            publishedAt: now,
            hasUnpublishedChanges: false,
          };
        }),
      };
    });
  },

  unpublishPrompt: (promptId) => {
    const now = new Date().toISOString();
    set((state) => ({
      prompts: state.prompts.map((p) => {
        if (p.id !== promptId) return p;
        return {
          ...p,
          status: "draft" as PromptStatus,
          publishedVersionId: null,
          publishedAt: null,
          lastUpdatedAt: now,
          hasUnpublishedChanges: false,
        };
      }),
    }));
  },

  archivePrompt: (promptId) => {
    const now = new Date().toISOString();
    set((state) => ({
      prompts: state.prompts.map((p) => {
        if (p.id !== promptId) return p;
        return {
          ...p,
          status: "archived" as PromptStatus,
          publishedVersionId: null,
          publishedAt: null,
          lastUpdatedAt: now,
          hasUnpublishedChanges: false,
        };
      }),
    }));
  },

  restorePrompt: (promptId) => {
    const now = new Date().toISOString();
    set((state) => ({
      prompts: state.prompts.map((p) => {
        if (p.id !== promptId) return p;
        return {
          ...p,
          status: "draft" as PromptStatus,
          lastUpdatedAt: now,
        };
      }),
    }));
  },

  savePromptAsNewVersion: (promptId, payload) => {
    const now = new Date().toISOString();
    set((state) => {
      const prompt = state.prompts.find((p) => p.id === promptId);
      if (!prompt) return state;

      const nextVersionNumber = getNextVersionNumber(prompt);
      const newVersion: PromptVersion = {
        id: `${promptId}-v${nextVersionNumber}`,
        version: nextVersionNumber,
        createdAt: now,
        description: payload.description,
        desiredOutcome: payload.desiredOutcome,
        content: payload.content,
      };

      const existingVersions = prompt.versions ?? [];

      return {
        prompts: state.prompts.map((p) => {
          if (p.id !== promptId) return p;
          return {
            ...p,
            content: payload.content,
            description: payload.description ?? p.description,
            desiredOutcome: payload.desiredOutcome ?? p.desiredOutcome,
            versions: [...existingVersions, newVersion],
            lastUpdatedAt: now,
            // Preserve publishedVersionId — new version is not auto-published
            hasUnpublishedChanges: p.status === "published" ? true : p.hasUnpublishedChanges,
          };
        }),
      };
    });
  },

  setPromptManagerSearch: (search) => set({ promptManagerSearch: search }),

  setPromptManagerStatusFilter: (filter) => set({ promptManagerStatusFilter: filter }),
}));
