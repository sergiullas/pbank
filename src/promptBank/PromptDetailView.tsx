import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useMemo, useState } from "react";
import type { PromptVersion } from "../types";
import { useStore } from "../state/store";

const byVersionDesc = (a: PromptVersion, b: PromptVersion) => b.version - a.version;

export function PromptDetailView() {
  const prompts = useStore((state) => state.prompts);
  const selectedPromptId = useStore((state) => state.selectedPromptId);
  const closePromptDetail = useStore((state) => state.closePromptDetail);
  const insertIntoComposer = useStore((state) => state.insertIntoComposer);
  const incrementUsage = useStore((state) => state.incrementUsage);
  const [selectedVersionNumber, setSelectedVersionNumber] = useState<number | null>(null);

  const prompt = useMemo(
    () => prompts.find((candidate) => candidate.id === selectedPromptId) ?? null,
    [prompts, selectedPromptId],
  );


  const activeVersion = useMemo(() => {
    if (!prompt) return null;

    if (prompt.versions?.length) {
      const latestVersionNumber = Math.max(...prompt.versions.map((version) => version.version));
      const resolvedVersionNumber = selectedVersionNumber ?? latestVersionNumber;

      return (
        prompt.versions.find((version) => version.version === resolvedVersionNumber) ??
        prompt.versions.find((version) => version.version === latestVersionNumber) ??
        null
      );
    }

    return {
      id: `${prompt.id}-v1`,
      version: 1,
      createdAt: prompt.createdAt,
      description: prompt.description,
      desiredOutcome: prompt.desiredOutcome,
      content: prompt.content,
    };
  }, [prompt, selectedVersionNumber]);

  if (!prompt || !activeVersion) {
    return (
      <Box p={2}>
        <Typography variant="body2" color="text.secondary">
          Select a prompt to preview its details.
        </Typography>
      </Box>
    );
  }

  const sortedVersions = prompt.versions ? [...prompt.versions].sort(byVersionDesc) : [];
  const latestVersionNumber = prompt.versions?.length
    ? Math.max(...prompt.versions.map((version) => version.version))
    : activeVersion.version;

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
          <Box>
            <Typography variant="caption" color="text.secondary">
              by {prompt.owner}
            </Typography>
          </Box>

          {prompt.versions?.length ? (
            <FormControl size="small" sx={{ maxWidth: 220 }}>
              <InputLabel id="version-select-label">Version</InputLabel>
              <Select
                labelId="version-select-label"
                label="Version"
                value={activeVersion.version}
                onChange={(event) => setSelectedVersionNumber(Number(event.target.value))}
              >
                {sortedVersions.map((version) => (
                  <MenuItem key={version.id} value={version.version}>
                    v{version.version}
                    {version.version === latestVersionNumber ? " (Latest)" : ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : null}

          {activeVersion.description && (
            <Typography variant="body2" color="text.secondary">
              {activeVersion.description}
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

          {activeVersion.desiredOutcome && (
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
                  {activeVersion.desiredOutcome}
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
                {activeVersion.content}
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
            insertIntoComposer(activeVersion.content);
            incrementUsage(prompt.id);
          }}
        >
          ← INSERT PROMPT
        </Button>
      </Box>
    </Box>
  );
}
