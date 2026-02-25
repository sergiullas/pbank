import { Box, List, Typography } from "@mui/material";
import { useMemo } from "react";
import { useStore } from "../state/store";
import { PromptListItem } from "./PromptListItem";

export function PromptList() {
  const prompts = useStore((state) => state.prompts);
  const promptQuery = useStore((state) => state.promptQuery);
  const filterMode = useStore((state) => state.filterMode);
  const selectedPromptId = useStore((state) => state.selectedPromptId);
  const favorites = useStore((state) => state.favorites);
  const openPromptDetail = useStore((state) => state.openPromptDetail);
  const toggleFavorite = useStore((state) => state.toggleFavorite);

  const filteredPrompts = useMemo(() => {
    const query = promptQuery.trim().toLowerCase();

    return prompts.filter((prompt) => {
      const matchesQuery =
        !query ||
        [prompt.title, prompt.content, ...prompt.tags]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesFilter = filterMode === "all" || Boolean(favorites[prompt.id]);

      return matchesQuery && matchesFilter;
    });
  }, [prompts, promptQuery, filterMode, favorites]);

  if (filteredPrompts.length === 0) {
    return (
      <Box p={2}>
        <Typography variant="body2" color="text.secondary">
          No prompts found.
        </Typography>
      </Box>
    );
  }

  return (
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
  );
}
