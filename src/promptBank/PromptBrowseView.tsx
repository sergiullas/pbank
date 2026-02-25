import { Box, List, Tab, Tabs, TextField, Typography } from "@mui/material";
import { useMemo } from "react";
import { useStore } from "../state/store";
import { PromptListItem } from "./PromptListItem";

export function PromptBrowseView() {
  const prompts = useStore((state) => state.prompts);
  const selectedPromptId = useStore((state) => state.selectedPromptId);
  const favorites = useStore((state) => state.favorites);
  const filterMode = useStore((state) => state.filterMode);
  const query = useStore((state) => state.promptQuery);
  const setPromptQuery = useStore((state) => state.setPromptQuery);
  const setFilterMode = useStore((state) => state.setFilterMode);
  const openPromptDetail = useStore((state) => state.openPromptDetail);
  const toggleFavorite = useStore((state) => state.toggleFavorite);

  const filteredPrompts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return prompts.filter((prompt) => {
      const matchesQuery =
        !normalizedQuery ||
        [prompt.title, prompt.content, ...prompt.tags].join(" ").toLowerCase().includes(normalizedQuery);
      const matchesFilter = filterMode === "all" || Boolean(favorites[prompt.id]);

      return matchesQuery && matchesFilter;
    });
  }, [prompts, query, filterMode, favorites]);

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
        />
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
