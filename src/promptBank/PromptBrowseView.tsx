import { Box, FormControl, InputLabel, List, MenuItem, Select, Tab, Tabs, TextField, Typography } from "@mui/material";
import { useMemo } from "react";
import { type SortMode, useStore } from "../state/store";
import type { Prompt } from "../types";
import { PromptListItem } from "./PromptListItem";

const SORT_LABELS: Record<SortMode, string> = {
  popular: "Most Popular",
  trending: "Trending",
  latest: "Latest",
};

const parseCreatedAt = (createdAt: string): number => {
  const parsed = Date.parse(createdAt);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const getRelevanceScore = (prompt: Prompt, query: string): number => {
  const normalizedQuery = query.toLowerCase();
  if (!normalizedQuery) return 0;

  let score = 0;
  if (prompt.title.toLowerCase().includes(normalizedQuery)) score += 3;
  if (prompt.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))) score += 2;
  if (prompt.description?.toLowerCase().includes(normalizedQuery)) score += 1;
  if (prompt.content.toLowerCase().includes(normalizedQuery)) score += 1;

  return score;
};

const sortPrompts = (prompts: Prompt[], sortMode: SortMode): Prompt[] => {
  return [...prompts].sort((a, b) => {
    const aLikes = a.likes;
    const bLikes = b.likes;
    const aCreated = parseCreatedAt(a.createdAt);
    const bCreated = parseCreatedAt(b.createdAt);

    if (sortMode === "popular") {
      return bLikes - aLikes || bCreated - aCreated;
    }

    if (sortMode === "latest") {
      return bCreated - aCreated || bLikes - aLikes;
    }

    const now = Date.now();
    const aDays = Math.max(0, Math.floor((now - aCreated) / 86_400_000));
    const bDays = Math.max(0, Math.floor((now - bCreated) / 86_400_000));
    const aTrendingScore = aLikes / (aDays + 1);
    const bTrendingScore = bLikes / (bDays + 1);

    return bTrendingScore - aTrendingScore || bLikes - aLikes;
  });
};

const sortByRelevance = (prompts: Prompt[], query: string): Prompt[] => {
  return [...prompts]
    .map((prompt) => ({
      prompt,
      relevanceScore: getRelevanceScore(prompt, query),
      createdAtMs: parseCreatedAt(prompt.createdAt),
    }))
    .filter((item) => item.relevanceScore > 0)
    .sort((a, b) => {
      return (
        b.relevanceScore - a.relevanceScore ||
        b.prompt.likes - a.prompt.likes ||
        b.createdAtMs - a.createdAtMs
      );
    })
    .map((item) => item.prompt);
};

export function PromptBrowseView() {
  const prompts = useStore((state) => state.prompts);
  const selectedPromptId = useStore((state) => state.selectedPromptId);
  const favorites = useStore((state) => state.favorites);
  const filterMode = useStore((state) => state.filterMode);
  const sortMode = useStore((state) => state.sortMode);
  const usageCounts = useStore((state) => state.usageCounts);
  const query = useStore((state) => state.promptQuery);
  const setPromptQuery = useStore((state) => state.setPromptQuery);
  const setFilterMode = useStore((state) => state.setFilterMode);
  const setSortMode = useStore((state) => state.setSortMode);
  const openPromptDetail = useStore((state) => state.openPromptDetail);
  const toggleFavorite = useStore((state) => state.toggleFavorite);
  const insertIntoComposer = useStore((state) => state.insertIntoComposer);
  const incrementUsage = useStore((state) => state.incrementUsage);

  const isSearching = query.trim().length > 0;

  const visiblePrompts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = prompts.filter((prompt) => {
      const matchesFilter = filterMode === "all" || Boolean(favorites[prompt.id]);
      if (!matchesFilter) return false;

      if (!normalizedQuery) return true;

      return (
        prompt.title.toLowerCase().includes(normalizedQuery) ||
        prompt.content.toLowerCase().includes(normalizedQuery) ||
        prompt.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery)) ||
        Boolean(prompt.description?.toLowerCase().includes(normalizedQuery))
      );
    });

    if (filterMode === "favorites") {
      return [...filtered].sort((a, b) => {
        const usageDiff = (usageCounts[b.id] ?? 0) - (usageCounts[a.id] ?? 0);
        if (usageDiff !== 0) return usageDiff;
        return b.likes - a.likes || parseCreatedAt(b.createdAt) - parseCreatedAt(a.createdAt);
      });
    }

    if (isSearching) {
      return sortByRelevance(filtered, normalizedQuery);
    }

    return sortPrompts(filtered, sortMode);
  }, [prompts, query, filterMode, favorites, isSearching, sortMode, usageCounts]);

  const selectValue = filterMode === "favorites" ? "mostUsed" : isSearching ? "relevance" : sortMode;
  const sortDisabled = filterMode === "favorites" || isSearching;

  const favoritesCount = useMemo(
    () => prompts.filter((prompt) => Boolean(favorites[prompt.id])).length,
    [prompts, favorites],
  );

  return (
    <Box display="flex" flexDirection="column" height="100%" minHeight={0}>
      <Box px={2} py={1.5} borderBottom={1} borderColor="divider">
        <Typography variant="h6" mb={1}>
          Prompt Library
        </Typography>

        <Tabs
          value={filterMode}
          onChange={(_, value: "all" | "favorites") => setFilterMode(value)}
          aria-label="Prompt filter"
          sx={{ minHeight: 36, mb: 1.5 }}
        >
          <Tab value="all" label="All" sx={{ minHeight: 36 }} />
          <Tab value="favorites" label={`Favorites (${favoritesCount})`} sx={{ minHeight: 36 }} />
        </Tabs>

        <Box display="flex" gap={1} alignItems="center">
          <TextField
            fullWidth
            size="small"
            placeholder="Search prompts…"
            value={query}
            onChange={(e) => setPromptQuery(e.target.value)}
          />

          <FormControl size="small" sx={{ minWidth: 160, width: 160 }}>
            <InputLabel id="prompt-sort-label">Sort</InputLabel>
            <Select
              labelId="prompt-sort-label"
              label="Sort"
              value={selectValue}
              disabled={sortDisabled}
              onChange={(event) => {
                const next = event.target.value;
                if (next === "popular" || next === "trending" || next === "latest") {
                  setSortMode(next);
                }
              }}
            >
              {filterMode === "favorites" ? (
                <MenuItem value="mostUsed">Most Used</MenuItem>
              ) : isSearching ? (
                <MenuItem value="relevance">Relevance</MenuItem>
              ) : (
                [
                  <MenuItem key="popular" value="popular">{SORT_LABELS.popular}</MenuItem>,
                  <MenuItem key="trending" value="trending">{SORT_LABELS.trending}</MenuItem>,
                  <MenuItem key="latest" value="latest">{SORT_LABELS.latest}</MenuItem>,
                ]
              )}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Box flex={1} minHeight={0} overflow="auto">
        {visiblePrompts.length === 0 ? (
          <Box p={2}>
            <Typography variant="body2" color="text.secondary">
              No prompts found.
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {visiblePrompts.map((prompt) => (
              <PromptListItem
                key={prompt.id}
                prompt={prompt}
                selected={selectedPromptId === prompt.id}
                isFavorite={Boolean(favorites[prompt.id])}
                isFavoritesView={filterMode === "favorites"}
                onSelect={openPromptDetail}
                onToggleFavorite={toggleFavorite}
                onInsert={(content, id) => {
                  insertIntoComposer(content);
                  incrementUsage(id);
                }}
              />
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
}
