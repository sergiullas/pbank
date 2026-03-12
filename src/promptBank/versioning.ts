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
