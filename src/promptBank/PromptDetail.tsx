import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { Box, Button, Chip, IconButton, Stack, Typography } from "@mui/material";
import { useMemo } from "react";
import { useStore } from "../state/store";

export function PromptDetail() {
  const prompts = useStore((state) => state.prompts);
  const selectedPromptId = useStore((state) => state.selectedPromptId);
  const promptQuery = useStore((state) => state.promptQuery);
  const favorites = useStore((state) => state.favorites);
  const filterMode = useStore((state) => state.filterMode);
  const insertIntoComposer = useStore((state) => state.insertIntoComposer);
  const incrementUsage = useStore((state) => state.incrementUsage);

  const prompt = useMemo(() => {
    const query = promptQuery.trim().toLowerCase();

    const visiblePrompts = prompts.filter((item) => {
      const matchesQuery =
        !query ||
        [item.title, item.content, ...item.tags].join(" ").toLowerCase().includes(query);
      const matchesFilter = filterMode === "all" || Boolean(favorites[item.id]);
      return matchesQuery && matchesFilter;
    });

    return visiblePrompts.find((item) => item.id === selectedPromptId) ?? null;
  }, [favorites, filterMode, promptQuery, prompts, selectedPromptId]);

  if (!prompt) {
    return (
      <Box p={2}>
        <Typography variant="body2" color="text.secondary">
          Select a prompt to preview its details.
        </Typography>
      </Box>
    );
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt.content);
  };

  return (
    <Stack spacing={1.5} p={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
        <Box>
          <Typography variant="h6">{prompt.title}</Typography>
          {prompt.description && (
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {prompt.description}
            </Typography>
          )}
        </Box>
        <IconButton aria-label="Copy prompt" onClick={handleCopy}>
          <ContentCopyIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Typography variant="caption" color="text.secondary">
        {prompt.category ?? "General"}
      </Typography>

      <Stack direction="row" spacing={0.75} flexWrap="wrap">
        {prompt.tags.map((tag) => (
          <Chip key={tag} label={tag} size="small" />
        ))}
      </Stack>

      <Box p={1.5} bgcolor="grey.100" borderRadius={2} maxHeight={220} overflow="auto">
        <Typography variant="body2" whiteSpace="pre-wrap">
          {prompt.content}
        </Typography>
      </Box>

      <Button
        variant="contained"
        onClick={() => {
          insertIntoComposer(prompt.content);
          incrementUsage(prompt.id);
        }}
      >
        Insert into Composer
      </Button>
    </Stack>
  );
}
