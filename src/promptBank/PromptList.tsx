import { Box, List, Typography } from "@mui/material";
import { useMemo } from "react";
import { useStore } from "../state/store";
import { PromptListItem } from "./PromptListItem";

export function PromptList() {
  const prompts = useStore((state) => state.prompts);
  const promptQuery = useStore((state) => state.promptQuery);
  const filterMode = useStore((state) => state.filterMode);
  const selectedPromptId = useStore((state) => state.selectedPromptId);
  const isPromptFavorited = useStore((state) => state.isPromptFavorited);
  const openPromptDetail = useStore((state) => state.openPromptDetail);
  const togglePromptFavorite = useStore((state) => state.togglePromptFavorite);
  const insertIntoComposer = useStore((state) => state.insertIntoComposer);
  const incrementUsage = useStore((state) => state.incrementUsage);

  const filteredPrompts = useMemo(() => {
    const query = promptQuery.trim().toLowerCase();

    return prompts.filter((prompt) => {
      const matchesQuery =
        !query ||
        [prompt.title, prompt.content, ...prompt.tags]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesFilter = filterMode === "all" || isPromptFavorited(prompt.id);

      return matchesQuery && matchesFilter;
    });
  }, [prompts, promptQuery, filterMode, isPromptFavorited]);

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
          isFavorite={isPromptFavorited(prompt.id)}
          isFavoritesView={false}
          onSelect={openPromptDetail}
          onToggleFavorite={togglePromptFavorite}
          onInsert={(content, id) => {
            insertIntoComposer(content);
            incrementUsage(id);
          }}
        />
      ))}
    </List>
  );
}
