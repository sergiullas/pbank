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
  desiredOutcome?: string;
  tags: string[];
  category?: string;
  likes: number;
  createdAt: string; // ISO
  owner?: string;
  media?: boolean;
};
