import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { Box, Button, Chip, IconButton, Stack, Typography } from "@mui/material";
import { useStore } from "../state/store";

export function PromptDetail() {
  const prompt = useStore((state) => state.getSelectedPrompt());
  const insertIntoComposer = useStore((state) => state.insertIntoComposer);

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

      <Button variant="contained" onClick={() => insertIntoComposer(prompt.content)}>
        Insert into Composer
      </Button>
    </Stack>
  );
}
