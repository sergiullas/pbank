import { create } from "zustand";
import { seedPrompts } from "../data/seedPrompts";
import { CURRENT_TENANT_ID, CURRENT_USER_ID } from "../data/mockDirectory";
import type { FavoriteItem, Message, Prompt, PromptShareState, PromptStatus, PromptVersion, PromptVisibility } from "../types";
import { getNextVersionNumber } from "../promptBank/versioning";
import { readJSON, writeJSON } from "./persist";
import { executePrompt } from "../chat/executePrompt";

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
  changelog?: string[];
};

export type NewVersionPayload = {
  description?: string;
  desiredOutcome?: string;
  content: string;
};

type UpdateVisibilityPayload = {
  visibility: PromptVisibility;
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
  hasPromptEditorUnsavedChanges: boolean;
  promptManagerNotice: string[];

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
  updatePromptVisibility: (promptId: string, payload: UpdateVisibilityPayload) => void;
  updatePromptSharedUsers: (promptId: string, userIds: string[]) => void;
  unpublishPrompt: (promptId: string) => void;
  archivePrompt: (promptId: string) => void;
  restorePrompt: (promptId: string) => void;
  savePromptAsNewVersion: (promptId: string, payload: NewVersionPayload) => void;
  discardPromptDraft: (promptId: string) => void;
  deletePrompt: (promptId: string) => void;
  setPromptManagerSearch: (search: string) => void;
  setPromptManagerStatusFilter: (filter: PromptManagerStatusFilter) => void;
  setPromptEditorUnsavedChanges: (value: boolean) => void;
  setPromptManagerNotice: (message: string | null) => void;
};

const normalizeFavorite = (favorite: FavoriteItem): FavoriteItem => ({
  ...favorite,
  id: favorite.version == null ? `${favorite.promptId}:latest` : `${favorite.promptId}:v${favorite.version}`,
  createdAt: favorite.createdAt ?? new Date().toISOString(),
});

const ownerToCreatorId: Record<string, string> = {
  "Natasha Romanoff (Black Widow)": "user-natasha",
  "Tony Stark (Iron Man)": "user-tony",
  "Steve Rogers (Captain America)": "user-steve",
  "Bruce Banner (Hulk)": "user-bruce",
  "Clint Barton (Hawkeye)": "user-clint",
  "Wanda Maximoff (Scarlet Witch)": "user-wanda",
  Vision: "user-vision",
  "Sam Wilson (Falcon)": "user-sam",
  "James Rhodes (War Machine)": "user-rhodes",
  "Scott Lang (Ant-Man)": "user-scott",
  "Carol Danvers (Captain Marvel)": "user-carol",
  "Guardians of the Galaxy": "user-guardians",
  User: CURRENT_USER_ID,
};

const seedVisibilityOverrides: Record<string, PromptVisibility> = {
  "structured-summary": "public",
  "email-draft": "public",
  "strategy-framework": "public",
  "meeting-notes": "public",
  "root-cause-analysis": "public",
  "user-research-plan": "public",
  "release-notes": "public",
  "competitive-analysis": "public",
};

const normalizeVisibility = (visibility: Prompt["visibility"] | "organization" | undefined): PromptVisibility | undefined => {
  if (visibility === "organization") return "public";
  if (visibility === "private" || visibility === "shared" || visibility === "public") return visibility;
  return undefined;
};

const normalizePromptModel = (prompt: Prompt): Prompt => {
  const sharedWith: PromptShareState = {
    users: Array.isArray(prompt.sharedWith?.users) ? prompt.sharedWith.users : [],
    groups: Array.isArray(prompt.sharedWith?.groups) ? prompt.sharedWith.groups : [],
  };

  return {
    ...prompt,
    creatorId: prompt.creatorId ?? ownerToCreatorId[prompt.owner] ?? CURRENT_USER_ID,
    tenantId: prompt.tenantId ?? CURRENT_TENANT_ID,
    visibility: normalizeVisibility(prompt.visibility) ?? seedVisibilityOverrides[prompt.id] ?? "private",
    sharedWith,
  };
};

const readFavorites = (): FavoriteItem[] => {
  const stored = readJSON<FavoriteItem[] | string[]>(STORAGE_KEYS.favorites, []);

  if (!Array.isArray(stored)) return [];
  if (stored.length === 0) return [];

  if (typeof stored[0] === "string") {
    const now = new Date().toISOString();
    const migrated = (stored as string[])
      .map((promptId) => {
        const prompt = seedPrompts.find((candidate) => candidate.id === promptId);
        const publishedVersion = prompt?.versions?.find((version) => version.id === prompt.publishedVersionId);
        return publishedVersion
          ? { id: `${promptId}:v${publishedVersion.version}`, promptId, version: publishedVersion.version, createdAt: now }
          : null;
      });
    return migrated.filter(Boolean) as FavoriteItem[];
  }

  const migrated = (stored as FavoriteItem[])
    .map((favorite) => {
      if (favorite.version != null) return normalizeFavorite(favorite);
      const prompt = seedPrompts.find((candidate) => candidate.id === favorite.promptId);
      const publishedVersion = prompt?.versions?.find((version) => version.id === prompt.publishedVersionId);
      if (!publishedVersion) return null;
      return normalizeFavorite({
        ...favorite,
        id: `${favorite.promptId}:v${publishedVersion.version}`,
        version: publishedVersion.version,
      });
    });
  return migrated.filter(Boolean) as FavoriteItem[];
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
  setAppMode: (mode) => {
    if (get().appMode === "promptManager" && mode !== "promptManager" && get().hasPromptEditorUnsavedChanges) {
      const shouldLeave = window.confirm("You have unsaved changes. Leave the editor and discard them?");
      if (!shouldLeave) return;
    }
    set({ appMode: mode });
  },
  openPromptManager: () => set({ appMode: "promptManager" }),
  closePromptManager: () => set({ appMode: "chat" }),

  // Library state
  libraryCollapsed: readLibraryCollapsed(),
  libraryView: "browse",
  prompts: seedPrompts.map(normalizePromptModel),
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
  promptManagerStatusFilter: "published",
  hasPromptEditorUnsavedChanges: false,
  promptManagerNotice: [],

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

  isPromptFavorited: (promptId) => get().favorites.some((favorite) => favorite.promptId === promptId),

  isVersionFavorited: (promptId, version) =>
    get().favorites.some((favorite) => favorite.promptId === promptId && favorite.version === version),

  togglePromptFavorite: (promptId) => {
    const prompt = get().prompts.find((candidate) => candidate.id === promptId);
    const publishedVersion = prompt?.versions?.find((version) => version.id === prompt.publishedVersionId) ?? null;
    if (!publishedVersion) return;
    get().toggleVersionFavorite(promptId, publishedVersion.version);
  },

  toggleVersionFavorite: (promptId, version) => {
    const versionFavoriteId = `${promptId}:v${version}`;
    const exists = get().favorites.some((favorite) => favorite.id === versionFavoriteId);
    const prompt = get().prompts.find((candidate) => candidate.id === promptId);
    if (!exists && prompt?.status === "archived") return;
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

    executePrompt({
      prompt: text,
      hasAttachment: get().hasAttachedFile,
    }).then((assistantText) => {
      const assistantMessage: Message = {
        id: createId(),
        role: "assistant",
        content: assistantText,
        createdAt: new Date().toISOString(),
      };

      set((state) => ({ messages: [...state.messages, assistantMessage] }));
    });
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
      title: "",
      description: "",
      desiredOutcome: "",
      category: "General",
      tags: [],
      content: "",
      likes: 0,
      createdAt: now,
      lastUpdatedAt: now,
      owner: "User",
      creatorId: CURRENT_USER_ID,
      tenantId: CURRENT_TENANT_ID,
      media: false,
      visibility: "private",
      sharedWith: { users: [], groups: [] },
        status: "draft",
        archivedFromStatus: null,
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
      if (prompt.visibility === "shared" && (prompt.sharedWith?.users.length ?? 0) === 0) return state;

      // Build a new version snapshot from the payload
      const nextVersionNumber = getNextVersionNumber(prompt);
      const newVersion: PromptVersion = {
        id: `${promptId}-v${nextVersionNumber}`,
        version: nextVersionNumber,
        createdAt: now,
        description: payload.description,
        desiredOutcome: payload.desiredOutcome,
        content: payload.content,
        changelog: payload.changelog,
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
            archivedFromStatus: null,
            publishedVersionId: newVersion.id,
            lastUpdatedAt: now,
            publishedAt: now,
            hasUnpublishedChanges: false,
          };
        }),
      };
    });
  },

  updatePromptVisibility: (promptId, payload) => {
    set((state) => ({
      prompts: state.prompts.map((prompt) => (
        prompt.id === promptId
          ? { ...prompt, visibility: payload.visibility, lastUpdatedAt: new Date().toISOString() }
          : prompt
      )),
    }));
  },

  updatePromptSharedUsers: (promptId, userIds) => {
    const uniqueUserIds = [...new Set(userIds.filter(Boolean))];
    set((state) => ({
      prompts: state.prompts.map((prompt) => (
        prompt.id === promptId
          ? {
            ...prompt,
            sharedWith: { users: uniqueUserIds, groups: prompt.sharedWith?.groups ?? [] },
            lastUpdatedAt: new Date().toISOString(),
          }
          : prompt
      )),
    }));
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
          archivedFromStatus: p.status === "archived" ? p.archivedFromStatus ?? "draft" : p.status,
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
          status: p.archivedFromStatus ?? "draft",
          archivedFromStatus: null,
          lastUpdatedAt: now,
        };
      }),
    }));
  },

  deletePrompt: (promptId) => {
    set((state) => ({
      prompts: state.prompts.filter((p) => !(p.id === promptId && p.status === "draft")),
      // If the deleted prompt was open in the editor, go back to list
      selectedManagedPromptId: state.selectedManagedPromptId === promptId ? null : state.selectedManagedPromptId,
      promptManagerView: state.selectedManagedPromptId === promptId ? "list" : state.promptManagerView,
    }));
  },

  savePromptAsNewVersion: (promptId, payload) => {
    const now = new Date().toISOString();
    set((state) => {
      const prompt = state.prompts.find((p) => p.id === promptId);
      if (!prompt) return state;

      // Store-level one-draft rule: never create a second draft working state.
      if (prompt.status === "draft") return state;

      return {
        prompts: state.prompts.map((p) => {
          if (p.id !== promptId) return p;
          return {
            ...p,
            status: "draft" as PromptStatus,
            content: payload.content,
            description: payload.description ?? p.description,
            desiredOutcome: payload.desiredOutcome ?? p.desiredOutcome,
            lastUpdatedAt: now,
            hasUnpublishedChanges: true,
          };
        }),
      };
    });
  },

  discardPromptDraft: (promptId) => {
    const now = new Date().toISOString();
    set((state) => {
      const prompt = state.prompts.find((p) => p.id === promptId);
      if (!prompt || prompt.status !== "draft") return state;

      // No published history at all → delete the prompt entirely
      if (!prompt.publishedVersionId) {
        return {
          prompts: state.prompts.filter((p) => p.id !== promptId),
          selectedManagedPromptId: state.selectedManagedPromptId === promptId ? null : state.selectedManagedPromptId,
          promptManagerView: state.selectedManagedPromptId === promptId ? "list" : state.promptManagerView,
        };
      }

      // Published version exists in the versions array → revert content from the snapshot
      if (prompt.versions?.length) {
        const publishedVersion = prompt.versions.find((version) => version.id === prompt.publishedVersionId);
        if (!publishedVersion) return state;

        return {
          prompts: state.prompts.map((p) => {
            if (p.id !== promptId) return p;
            return {
              ...p,
              status: "published" as PromptStatus,
              description: publishedVersion.description ?? p.description,
              desiredOutcome: publishedVersion.desiredOutcome ?? p.desiredOutcome,
              content: publishedVersion.content,
              hasUnpublishedChanges: false,
              lastUpdatedAt: now,
            };
          }),
        };
      }

      // Synthesized-v1 case: publishedVersionId is set but no versions array exists.
      // No separate content snapshot is available; restore lifecycle status only.
      return {
        prompts: state.prompts.map((p) => {
          if (p.id !== promptId) return p;
          return {
            ...p,
            status: "published" as PromptStatus,
            hasUnpublishedChanges: false,
            lastUpdatedAt: now,
          };
        }),
      };
    });
  },

  setPromptManagerSearch: (search) => set({ promptManagerSearch: search }),

  setPromptManagerStatusFilter: (filter) => set({ promptManagerStatusFilter: filter }),
  setPromptEditorUnsavedChanges: (value) => set({ hasPromptEditorUnsavedChanges: value }),
  setPromptManagerNotice: (message) => set((state) => {
    if (message == null) {
      return { promptManagerNotice: state.promptManagerNotice.slice(1) };
    }
    return { promptManagerNotice: [...state.promptManagerNotice, message] };
  }),
}));
