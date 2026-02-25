import { create } from "zustand";
import { seedPrompts } from "../data/seedPrompts";
import type { Message, Prompt } from "../types";

const createId = () => crypto.randomUUID();

type StoreState = {
  messages: Message[];
  composerText: string;
  composerFocusSignal: number;
  prompts: Prompt[];
  promptQuery: string;
  selectedPromptId: string | null;
  setComposerText: (text: string) => void;
  sendMessage: () => void;
  insertIntoComposer: (text: string) => void;
  setPromptQuery: (q: string) => void;
  selectPrompt: (id: string) => void;
  filteredPrompts: () => Prompt[];
  getSelectedPrompt: () => Prompt | null;
};

export const useStore = create<StoreState>((set, get) => ({
  messages: [],
  composerText: "",
  composerFocusSignal: 0,
  prompts: seedPrompts.map((prompt) => ({ ...prompt, usageCount: prompt.usageCount ?? 0 })),
  promptQuery: "",
  selectedPromptId: seedPrompts[0]?.id ?? null,

  setComposerText: (text) => set({ composerText: text }),

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

  insertIntoComposer: (text) => {
    const current = get().composerText;
    const merged = current.trim().length > 0 ? `${current}\n${text}` : text;

    set((state) => ({
      composerText: merged,
      composerFocusSignal: state.composerFocusSignal + 1,
    }));
  },

  setPromptQuery: (q) => set({ promptQuery: q }),

  selectPrompt: (id) => set({ selectedPromptId: id }),

  filteredPrompts: () => {
    const { prompts, promptQuery } = get();
    const query = promptQuery.trim().toLowerCase();
    if (!query) return prompts;

    return prompts.filter((prompt) => {
      const haystack = [prompt.title, prompt.content, ...(prompt.tags ?? [])].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  },

  getSelectedPrompt: () => {
    const { selectedPromptId, prompts } = get();
    return prompts.find((prompt) => prompt.id === selectedPromptId) ?? null;
  },
}));
