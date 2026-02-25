export type Role = "user" | "assistant";

export type Message = {
  id: string;
  role: Role;
  content: string;
  createdAt: string;
};

export type Prompt = {
  id: string;
  title: string;
  content: string;
  description?: string;
  tags: string[];
  category?: string;
  isFavorite?: boolean;
  usageCount?: number;
  createdAt?: string;
  updatedAt?: string;
};
