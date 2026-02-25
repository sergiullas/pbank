import { Box, List, Typography } from "@mui/material";
import { useEffect } from "react";
import { useStore } from "../state/store";
import { PromptListItem } from "./PromptListItem";

export function PromptList() {
  const filteredPrompts = useStore((state) => state.filteredPrompts());
  const selectedPromptId = useStore((state) => state.selectedPromptId);
  const favorites = useStore((state) => state.favorites);
  const selectPrompt = useStore((state) => state.selectPrompt);
  const toggleFavorite = useStore((state) => state.toggleFavorite);

  useEffect(() => {
    if (filteredPrompts.length === 0) {
      if (selectedPromptId !== null) {
        selectPrompt(null);
      }
      return;
    }

    const existsInFiltered = filteredPrompts.some((prompt) => prompt.id === selectedPromptId);
    if (!existsInFiltered) {
      selectPrompt(filteredPrompts[0].id);
    }
  }, [filteredPrompts, selectedPromptId, selectPrompt]);

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
          onSelect={selectPrompt}
          onToggleFavorite={toggleFavorite}
        />
      ))}
    </List>
  );
}
