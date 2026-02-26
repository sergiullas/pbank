import { Box, FormControl, InputLabel, List, MenuItem, Select, Tab, Tabs, TextField, Typography } from "@mui/material";
import { useMemo } from "react";
import { type SortMode, useStore } from "../state/store";
import type { Prompt } from "../types";
import { PromptListItem } from "./PromptListItem";

const normalizeUpdatedToHours = (updated: Prompt["updated"]): number => {
  if (updated instanceof Date) {
    const diffMs = Date.now() - updated.getTime();
    return Math.max(diffMs / (1000 * 60 * 60), 0);
  }

  const value = `${updated}`.toLowerCase();
  if (value.includes("hour")) {
    return 24;
  }
  if (value.includes("day")) {
    const days = Number.parseInt(value, 10);
    return Number.isNaN(days) ? 24 : days * 24;
  }

  // "Any Time" and unknown values should sort as the oldest recency.
  return Number.POSITIVE_INFINITY;
};

const sortPrompts = (prompts: Prompt[], sortMode: SortMode, usageCounts: Record<string, number>): Prompt[] => {
  const withMetrics = prompts.map((prompt) => {
    const likes = prompt.likes ?? 0;
    const usage = usageCounts[prompt.id] ?? 0;
    const recencyHours = normalizeUpdatedToHours(prompt.updated);

    const trendingScore = usage * 20 + likes / Math.max(recencyHours, 1);
    const popularityScore = likes * 2 + usage * 15;

    return {
      prompt,
      likes,
      usage,
      recencyHours,
      trendingScore,
      popularityScore,
    };
  });

  const sorted = [...withMetrics].sort((a, b) => {
    if (sortMode === "latest") {
      return a.recencyHours - b.recencyHours || b.likes - a.likes;
    }

    if (sortMode === "trending") {
      return b.trendingScore - a.trendingScore || b.likes - a.likes;
    }

    return b.popularityScore - a.popularityScore || b.likes - a.likes;
  });

  return sorted.map((item) => item.prompt);
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

  const filteredPrompts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const matches = prompts.filter((prompt) => {
      const matchesQuery =
        !normalizedQuery ||
        [prompt.title, prompt.content, ...prompt.tags].join(" ").toLowerCase().includes(normalizedQuery);
      const matchesFilter = filterMode === "all" || Boolean(favorites[prompt.id]);

      return matchesQuery && matchesFilter;
    });

    return sortPrompts(matches, sortMode, usageCounts);
  }, [prompts, query, filterMode, favorites, sortMode, usageCounts]);

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

        <TextField
          fullWidth
          size="small"
          placeholder="Search prompts…"
          value={query}
          onChange={(e) => setPromptQuery(e.target.value)}
          sx={{ mb: 1.5 }}
        />

        <FormControl size="small" fullWidth>
          <InputLabel id="prompt-sort-label">Sort by</InputLabel>
          <Select
            labelId="prompt-sort-label"
            value={sortMode}
            label="Sort by"
            onChange={(event) => setSortMode(event.target.value as SortMode)}
          >
            <MenuItem value="latest">Latest</MenuItem>
            <MenuItem value="trending">Trending</MenuItem>
            <MenuItem value="mostPopular">Most Popular</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box flex={1} minHeight={0} overflow="auto">
        {filteredPrompts.length === 0 ? (
          <Box p={2}>
            <Typography variant="body2" color="text.secondary">
              No prompts found.
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {filteredPrompts.map((prompt) => (
              <PromptListItem
                key={prompt.id}
                prompt={prompt}
                selected={selectedPromptId === prompt.id}
                isFavorite={Boolean(favorites[prompt.id])}
                onSelect={openPromptDetail}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
}
