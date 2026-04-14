import type { Prompt } from "../types";

export type PromptManagerStatusFilter = "all" | "draft" | "published" | "archived";
export type PromptManagerSortMode = "lastUpdated" | "title" | "status";

/**
 * Filter prompts for the Published Prompts section of Prompt Manager.
 *
 * "all" here means published + archived — drafts are never included because
 * they live in the dedicated Drafts card strip above the list.
 */
export function filterManagerPrompts(
  prompts: Prompt[],
  search: string,
  statusFilter: PromptManagerStatusFilter,
): Prompt[] {
  const normalizedSearch = search.trim().toLowerCase();

  return prompts.filter((prompt) => {
    // "all" in the Published Prompts section = published + archived (not draft)
    if (statusFilter === "all" && prompt.status === "draft") return false;
    if (statusFilter !== "all" && prompt.status !== statusFilter) return false;

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
 * Returns a compact version label for use in the metadata line (e.g. "v3").
 */
export function getVersionLabel(prompt: Prompt): string {
  if (!prompt.versions?.length) return "v1";
  return `v${Math.max(...prompt.versions.map((v) => v.version))}`;
}

/**
 * Returns a human-readable date string or placeholder.
 */
export function formatLastUpdated(prompt: Prompt): string {
  const raw = prompt.lastUpdatedAt ?? prompt.createdAt;
  if (!raw) return "—";

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/**
 * Returns a compact metadata string: "v3 • Updated Mar 14, 2026 • tag1 • tag2"
 */
export function getMetaLine(prompt: Prompt): string {
  const parts: string[] = [getVersionLabel(prompt), `Updated ${formatLastUpdated(prompt)}`];
  prompt.tags.slice(0, 2).forEach((tag) => parts.push(tag));
  return parts.join(" • ");
}

/**
 * Filter options shown in the Published Prompts section.
 * Draft is intentionally excluded — drafts live in the Drafts card strip.
 * "all" in this context means published + archived.
 */
export const STATUS_FILTER_OPTIONS: PromptManagerStatusFilter[] = ["published", "archived", "all"];

export const STATUS_FILTER_LABELS: Record<PromptManagerStatusFilter, string> = {
  all: "All",
  draft: "Draft",       // kept in type for store compatibility; not shown in UI
  published: "Published",
  archived: "Archived",
};
