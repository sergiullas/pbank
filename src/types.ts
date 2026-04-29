export type Role = "user" | "assistant";

export type Message = {
  id: string;
  role: Role;
  content: string;
  createdAt: string;
};

export type PromptStatus = "draft" | "published" | "archived";

export type VisibilityLevel = "private" | "shared" | "organization";

export type SharedWith = {
  users: string[];
  groups: string[];
};

export type PromptVersion = {
  id: string;
  version: number;
  createdAt: string;
  description?: string;
  desiredOutcome?: string;
  content: string;
  changelog?: string[];
};

export type Prompt = {
  id: string;
  title: string;
  description?: string;
  desiredOutcome?: string;
  category: string;
  tags: string[];
  content: string;
  likes: number;
  createdAt: string;
  owner: string;
  ownerId?: string;
  media: boolean;
  versions?: PromptVersion[];
  // Lifecycle fields
  status: PromptStatus;
  archivedFromStatus?: Exclude<PromptStatus, "archived"> | null;
  publishedVersionId?: string | null;
  lastUpdatedAt?: string;
  publishedAt?: string | null;
  hasUnpublishedChanges?: boolean;
  visibility?: VisibilityLevel;
  sharedWith?: SharedWith;
};

export type FavoriteItem = {
  id: string;
  promptId: string;
  version?: number;
  createdAt: string;
};
