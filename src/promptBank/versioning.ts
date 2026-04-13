import type { FavoriteItem, Prompt, PromptVersion } from "../types";

/**
 * Resolves the initial version number to display when opening a prompt in Prompt Library.
 *
 * Priority order:
 *   1. Explicit version number passed by the caller (e.g. from a favorites row click)
 *   2. The user's version-specific favorite for this prompt
 *   3. The prompt's publishedVersionId
 *   4. null → caller should fall back to getLatestVersion
 */
export function resolveInitialLibraryVersion(
  prompt: Prompt | null,
  favorites: FavoriteItem[],
  explicitVersionNumber?: number | null,
): number | null {
  if (explicitVersionNumber != null) return explicitVersionNumber;
  if (!prompt?.versions?.length) return null;

  // Priority 2: user has a version-specific favorite for this prompt
  const versionFav = favorites.find((f) => f.promptId === prompt.id && f.version != null);
  if (versionFav?.version != null) return versionFav.version;

  // Priority 3: the prompt's published version
  if (prompt.publishedVersionId) {
    const published = prompt.versions.find((v) => v.id === prompt.publishedVersionId);
    if (published) return published.version;
  }

  // Priority 4: fall back to latest (caller uses getLatestVersion when null)
  return null;
}

export type PromptVersionLike = PromptVersion;

export function getLatestVersion(prompt: Prompt): PromptVersionLike {
  if (prompt.versions?.length) {
    return prompt.versions.reduce((latest, current) =>
      current.version > latest.version ? current : latest,
    );
  }

  return {
    id: `${prompt.id}-v1`,
    version: 1,
    createdAt: prompt.createdAt,
    description: prompt.description,
    desiredOutcome: prompt.desiredOutcome,
    content: prompt.content,
  };
}

export function getVersionByNumber(prompt: Prompt, version?: number): PromptVersionLike {
  if (!prompt.versions?.length || version == null) {
    return getLatestVersion(prompt);
  }

  return prompt.versions.find((candidate) => candidate.version === version) ?? getLatestVersion(prompt);
}

export function resolveFavoritePromptVersion(prompt: Prompt, favorite: FavoriteItem): PromptVersionLike {
  return getVersionByNumber(prompt, favorite.version);
}

/**
 * Returns the published version of a prompt for use in Prompt Library.
 * Falls back to latest version when publishedVersionId is not set.
 */
export function getPublishedVersion(prompt: Prompt): PromptVersionLike {
  if (!prompt.publishedVersionId) {
    return getLatestVersion(prompt);
  }

  // Look in explicit versions array first
  if (prompt.versions?.length) {
    const found = prompt.versions.find((v) => v.id === prompt.publishedVersionId);
    if (found) return found;
  }

  // Synthesized v1 case — prompt has no versions array but has a publishedVersionId
  if (prompt.publishedVersionId === `${prompt.id}-v1`) {
    return {
      id: `${prompt.id}-v1`,
      version: 1,
      createdAt: prompt.createdAt,
      description: prompt.description,
      desiredOutcome: prompt.desiredOutcome,
      content: prompt.content,
    };
  }

  // Fallback to latest
  return getLatestVersion(prompt);
}

/**
 * Returns the next available version number for a prompt.
 */
export function getNextVersionNumber(prompt: Prompt): number {
  if (!prompt.versions?.length) return 2;
  return Math.max(...prompt.versions.map((v) => v.version)) + 1;
}
