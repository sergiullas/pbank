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
  updated: string | Date; // Allows "Last 7 Days" or a Date object
  owner?: string;         // e.g., "Natasha Romanoff"
  media?: boolean;        // Indicates if it contains images/video
  likes?: number;         // Social engagement metric
};