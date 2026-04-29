import { CURRENT_USER_ID } from "../data/mockUsers";
import type { Prompt } from "../types";

export const userHasLibraryAccess = (prompt: Prompt): boolean => {
  const visibility = prompt.visibility ?? "organization";
  if (visibility === "organization") return true;
  if (prompt.ownerId === CURRENT_USER_ID) return true;
  if (visibility === "shared") {
    return prompt.sharedWith?.users.includes(CURRENT_USER_ID) ?? false;
  }
  return false;
};

export const isOwnPrompt = (prompt: Prompt): boolean =>
  prompt.ownerId === CURRENT_USER_ID;
