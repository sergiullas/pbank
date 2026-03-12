import { create } from "zustand";
import { seedPrompts } from "../data/seedPrompts";
import type { FavoriteItem, Message, Prompt } from "../types";
import { readJSON, writeJSON } from "./persist";

const STORAGE_KEYS = {
  libraryCollapsed: "promptBank.libraryCollapsed",
  favorites: "promptBank.favorites",
  usageCounts: "promptBank.usageCounts",
} as const;

const createId = () => crypto.randomUUID();

type FilterMode = "all" | "favorites" | "featured";
type LibraryView = "browse" | "detail";
export type SortMode = "popular" | "trending" | "latest";

type StoreState = {
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
  messages: Message[];
  composerText: string;
  composerFocusSignal: number;
  hasAttachedFile: boolean;
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
  setComposerText: (text: string) => void;
  insertIntoComposer: (text: string) => void;
  setHasAttachedFile: (value: boolean) => void;
  sendMessage: () => void;
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

const readLibraryCollapsed = (): boolean => readJSON<boolean>(STORAGE_KEYS.libraryCollapsed, false);

const readUsageCounts = (): Record<string, number> => readJSON<Record<string, number>>(STORAGE_KEYS.usageCounts, {});

const initialFavorites = readFavorites();
const initialUsageCounts = readUsageCounts();

export const useStore = create<StoreState>((set, get) => ({
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
  messages: [],
  composerText: "",
  composerFocusSignal: 0,
  hasAttachedFile: false,

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

  setComposerText: (text) => set({ composerText: text }),

  insertIntoComposer: (text) => {
    const current = get().composerText;
    const merged = current.trim().length > 0 ? `${current}\n${text}` : text;

    set((state) => ({
      composerText: merged,
      composerFocusSignal: state.composerFocusSignal + 1,
    }));
  },

  setHasAttachedFile: (value) => set({ hasAttachedFile: value }),

  sendMessage: () => {
    const text = get().composerText.trim();
    if (!text) return;

    const userMessage: Message = {
      id: createId(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      composerText: "",
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
}));
