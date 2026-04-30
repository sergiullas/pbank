import { CURRENT_TENANT_ID, CURRENT_USER_ID } from "../data/mockDirectory";
import type { Prompt } from "../types";

export const isPromptArchived = (prompt: Prompt): boolean => prompt.status === "archived";

export const userHasPromptAccess = (prompt: Prompt, userId = CURRENT_USER_ID): boolean => {
  const archived = (prompt as Prompt & { archived?: boolean }).archived === true;
  if (prompt.status !== "published" || isPromptArchived(prompt) || archived) return false;
  if (prompt.creatorId === userId) return true;

  if (prompt.visibility === "public") {
    return prompt.tenantId === CURRENT_TENANT_ID;
  }

  if (prompt.visibility === "shared") {
    return (prompt.sharedWith?.users ?? []).includes(userId);
  }

  return false;
};

export const isPromptMine = (prompt: Prompt, userId = CURRENT_USER_ID): boolean => prompt.creatorId === userId;

export const getPromptVisibilityTooltip = (prompt: Prompt): string => {
  if (prompt.visibility === "private") return "Private";
  if (prompt.visibility === "shared") return "Shared";
  return "Public";
};
