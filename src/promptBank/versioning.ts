import type { FavoriteItem, Prompt, PromptVersion } from "../types";

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
