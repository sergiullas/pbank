export type Role = "user" | "assistant";

export type Message = {
  id: string;
  role: Role;
  content: string;
  createdAt: string;
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
  media: boolean;
  versions?: PromptVersion[];
};
