import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useMemo, useState } from "react";
import type { PromptVersion } from "../types";
import { useStore } from "../state/store";

const byVersionDesc = (a: PromptVersion, b: PromptVersion) => b.version - a.version;

type VersionSelection = {
  promptId: string | null;
  version: number | null;
};

export function PromptDetailView() {
  const prompts = useStore((state) => state.prompts);
  const selectedPromptId = useStore((state) => state.selectedPromptId);
  const closePromptDetail = useStore((state) => state.closePromptDetail);
  const insertIntoComposer = useStore((state) => state.insertIntoComposer);
  const incrementUsage = useStore((state) => state.incrementUsage);
  const [selection, setSelection] = useState<VersionSelection>({ promptId: null, version: null });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const prompt = useMemo(
    () => prompts.find((candidate) => candidate.id === selectedPromptId) ?? null,
    [prompts, selectedPromptId],
  );

  const activeVersion = useMemo(() => {
    if (!prompt) return null;

    if (prompt.versions?.length) {
      const latestVersionNumber = Math.max(...prompt.versions.map((version) => version.version));
      const selectedVersionNumber = selection.promptId === prompt.id ? selection.version : null;
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
  }, [prompt, selection]);

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
  const isLatestVersion = activeVersion.version === latestVersionNumber;
  const menuOpen = Boolean(anchorEl);

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
            <Typography variant="caption" color="text.secondary" component="span">
              by {prompt.owner}
            </Typography>
            {prompt.versions?.length ? (
              <>
                <Typography variant="caption" color="text.secondary" component="span">
                  {" · "}
                </Typography>
                <Button
                  variant="text"
                  size="small"
                  disableRipple
                  disableElevation
                  aria-label="Select prompt version"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen ? "true" : undefined}
                  onClick={(event) => setAnchorEl(event.currentTarget)}
                  sx={{
                    textTransform: "none",
                    minWidth: 0,
                    p: 0,
                    fontSize: "inherit",
                    lineHeight: 1.2,
                    color: "text.secondary",
                    verticalAlign: "baseline",
                    "&:hover": { textDecoration: "underline", bgcolor: "transparent", color: "text.primary" },
                  }}
                >
                  v{activeVersion.version}
                  {isLatestVersion ? " (Latest)" : ""}
                </Button>
                <Menu
                  anchorEl={anchorEl}
                  open={menuOpen}
                  onClose={() => setAnchorEl(null)}
                  MenuListProps={{ "aria-label": "Prompt versions" }}
                >
                  {sortedVersions.map((version) => (
                    <MenuItem
                      key={version.id}
                      selected={version.version === activeVersion.version}
                      onClick={() => {
                        setSelection({ promptId: prompt.id, version: version.version });
                        setAnchorEl(null);
                      }}
                    >
                      v{version.version}
                      {version.version === latestVersionNumber ? " (Latest)" : ""}
                    </MenuItem>
                  ))}
                </Menu>
              </>
            ) : null}
          </Box>

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
