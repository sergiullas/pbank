import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { Box, Button, Chip, IconButton, Stack, Typography } from "@mui/material";
import { useMemo } from "react";
import { useStore } from "../state/store";

export function PromptDetailView() {
  const prompts = useStore((state) => state.prompts);
  const selectedPromptId = useStore((state) => state.selectedPromptId);
  const closePromptDetail = useStore((state) => state.closePromptDetail);
  const insertIntoComposer = useStore((state) => state.insertIntoComposer);
  const incrementUsage = useStore((state) => state.incrementUsage);

  const prompt = useMemo(
    () => prompts.find((candidate) => candidate.id === selectedPromptId) ?? null,
    [prompts, selectedPromptId],
  );

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
    <Box display="flex" flexDirection="column" height="100%" minHeight={0}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap={1}
        px={1}
        py={1}
        borderBottom={1}
        borderColor="divider"
      >
        <Stack direction="row" alignItems="center" minWidth={0}>
          <IconButton aria-label="Back to prompt list" onClick={closePromptDetail}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="subtitle1" fontWeight={600} noWrap>
            {prompt.title}
          </Typography>
        </Stack>
        <IconButton aria-label="Copy prompt" onClick={handleCopy}>
          <ContentCopyIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Box flex={1} minHeight={0} overflow="auto" p={2}>
        <Stack spacing={1.5}>
          <Typography variant="caption" color="text.secondary">
            {prompt.category ?? "General"}
          </Typography>

          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            {prompt.tags.map((tag) => (
              <Chip key={tag} label={tag} size="small" />
            ))}
          </Stack>

          {prompt.description && (
            <Typography variant="body2" color="text.secondary">
              {prompt.description}
            </Typography>
          )}

          <Box p={1.5} bgcolor="grey.100" borderRadius={2}>
            <Typography variant="body2" whiteSpace="pre-wrap">
              {prompt.content}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box
        position="sticky"
        bottom={0}
        p={2}
        borderTop={1}
        borderColor="divider"
        bgcolor="background.paper"
      >
        <Stack spacing={1}  direction="row" >
          <Button
            variant="contained"
            fullWidth
            onClick={() => {
              insertIntoComposer(prompt.content);
              incrementUsage(prompt.id);
            }}
          >
            ← Insert Prompt
          </Button>
          <Button variant="outlined"  onClick={handleCopy}>
            Copy
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
