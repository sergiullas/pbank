import type { Prompt, PromptStatus } from "../types";

export type PromptManagerStatusFilter = "all" | "draft" | "published" | "archived";
export type PromptManagerSortMode = "lastUpdated" | "title" | "status";

/**
 * Filter prompts by status and search query for Prompt Manager view.
 * Prompt Manager shows ALL prompts regardless of published status.
 */
export function filterManagerPrompts(
  prompts: Prompt[],
  search: string,
  statusFilter: PromptManagerStatusFilter,
): Prompt[] {
  const normalizedSearch = search.trim().toLowerCase();

  return prompts.filter((prompt) => {
    // Status filter
    if (statusFilter !== "all" && prompt.status !== statusFilter) return false;

    // Search filter
    if (normalizedSearch) {
      return (
        prompt.title.toLowerCase().includes(normalizedSearch) ||
        (prompt.description?.toLowerCase().includes(normalizedSearch) ?? false) ||
        prompt.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch))
      );
    }

    return true;
  });
}

/**
 * Sort prompts for Prompt Manager list.
 * Default: last updated descending, fall back to title ascending.
 */
export function sortManagerPrompts(prompts: Prompt[]): Prompt[] {
  return [...prompts].sort((a, b) => {
    const aTime = Date.parse(a.lastUpdatedAt ?? a.createdAt);
    const bTime = Date.parse(b.lastUpdatedAt ?? b.createdAt);
    if (bTime !== aTime) return bTime - aTime;
    return a.title.localeCompare(b.title);
  });
}

/**
 * Returns a human-readable summary of a prompt's version state.
 */
export function getVersionSummary(prompt: Prompt): string {
  const versionCount = prompt.versions?.length ?? 0;
  if (versionCount === 0) return "v1";
  if (versionCount === 1) return "v1";
  return `v${versionCount} (${versionCount} versions)`;
}

/**
 * Returns a formatted date string or placeholder.
 */
export function formatLastUpdated(prompt: Prompt): string {
  const raw = prompt.lastUpdatedAt ?? prompt.createdAt;
  if (!raw) return "—";

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export const STATUS_FILTER_LABELS: Record<PromptManagerStatusFilter, string> = {
  all: "All",
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export const STATUS_FILTER_OPTIONS: PromptManagerStatusFilter[] = ["all", "draft", "published", "archived"];
