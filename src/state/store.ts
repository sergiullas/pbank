import { create } from "zustand";
import { seedPrompts } from "../data/seedPrompts";
import type { Message, Prompt } from "../types";
import { readJSON, writeJSON } from "./persist";

const STORAGE_KEYS = {
  libraryCollapsed: "promptBank.libraryCollapsed",
  favorites: "promptBank.favorites",
  usageCounts: "promptBank.usageCounts",
} as const;

const createId = () => crypto.randomUUID();

type FilterMode = "all" | "favorites";

type StoreState = {
  libraryCollapsed: boolean;
  prompts: Prompt[];
  promptQuery: string;
  selectedPromptId: string | null;
  favorites: Record<string, true>;
  filterMode: FilterMode;
  usageCounts: Record<string, number>;
  messages: Message[];
  composerText: string;
  composerFocusSignal: number;
  setLibraryCollapsed: (next: boolean) => void;
  toggleLibraryCollapsed: () => void;
  setPromptQuery: (q: string) => void;
  selectPrompt: (id: string | null) => void;
  toggleFavorite: (id: string) => void;
  setFilterMode: (mode: FilterMode) => void;
  incrementUsage: (id: string) => void;
  setComposerText: (text: string) => void;
  insertIntoComposer: (text: string) => void;
  sendMessage: () => void;
};

const readFavorites = (): Record<string, true> => {
  const stored = readJSON<string[]>(STORAGE_KEYS.favorites, []);
  return stored.reduce<Record<string, true>>((acc, id) => {
    acc[id] = true;
    return acc;
  }, {});
};

const readLibraryCollapsed = (): boolean => readJSON<boolean>(STORAGE_KEYS.libraryCollapsed, false);

const readUsageCounts = (): Record<string, number> => readJSON<Record<string, number>>(STORAGE_KEYS.usageCounts, {});

const initialFavorites = readFavorites();
const initialUsageCounts = readUsageCounts();

export const useStore = create<StoreState>((set, get) => ({
  libraryCollapsed: readLibraryCollapsed(),
  prompts: seedPrompts,
  promptQuery: "",
  selectedPromptId: seedPrompts[0]?.id ?? null,
  favorites: initialFavorites,
  filterMode: "all",
  usageCounts: initialUsageCounts,
  messages: [],
  composerText: "",
  composerFocusSignal: 0,

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

  selectPrompt: (id) => set({ selectedPromptId: id }),

  toggleFavorite: (id) => {
    const nextFavorites = { ...get().favorites };
    if (nextFavorites[id]) {
      delete nextFavorites[id];
    } else {
      nextFavorites[id] = true;
    }

    writeJSON(STORAGE_KEYS.favorites, Object.keys(nextFavorites));
    set({ favorites: nextFavorites });
  },

  setFilterMode: (mode) => set({ filterMode: mode }),

  incrementUsage: (id) => {
    const currentUsage = get().usageCounts;
    const nextUsage = {
      ...currentUsage,
      [id]: (currentUsage[id] ?? 0) + 1,
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
