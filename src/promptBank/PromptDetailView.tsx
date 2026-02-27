import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Box, Button, Chip, Divider, IconButton, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
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

  return (
    <Box display="flex" flexDirection="column" height="100%" minHeight={0}>
      <Stack
        direction="row"
        alignItems="center"
        gap={1}
        px={1}
        py={1}
        borderBottom={1}
        borderColor="divider"
      >
        <IconButton aria-label="Back to prompt list" onClick={closePromptDetail}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="subtitle1" fontWeight={600} noWrap>
          {prompt.title}
        </Typography>
      </Stack>

      <Box flex={1} minHeight={0} overflow="auto" p={2}>
        <Stack spacing={2}>
          {prompt.description && (
            <Typography variant="body2" color="text.secondary">
              {prompt.description}
            </Typography>
          )}

          <Stack spacing={1}>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
              Categories
            </Typography>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              {prompt.tags.map((tag) => (
                <Chip key={tag} label={tag} size="small" />
              ))}
            </Stack>
          </Stack>

          <Divider sx={{ my: 0.5 }} />

          {prompt.desiredOutcome && (
            <Stack spacing={1}>
              <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
                Desired Outcome
              </Typography>
              <Box
                p={2}
                borderRadius={2}
                sx={{ bgcolor: (theme) => alpha(theme.palette.success.main, 0.1) }}
              >
                <Typography variant="body2" color="text.primary">
                  {prompt.desiredOutcome}
                </Typography>
              </Box>
            </Stack>
          )}

          <Stack spacing={1}>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
              Prompt Template
            </Typography>
            <Box p={2} bgcolor="grey.100" borderRadius={2}>
              <Typography variant="body2" whiteSpace="pre-wrap">
                {prompt.content}
              </Typography>
            </Box>
          </Stack>
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
        <Button
          variant="contained"
          fullWidth
          onClick={() => {
            insertIntoComposer(prompt.content);
            incrementUsage(prompt.id);
          }}
        >
          ← INSERT PROMPT
        </Button>
      </Box>
    </Box>
  );
}
