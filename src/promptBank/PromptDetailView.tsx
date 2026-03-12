import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import StarIcon from "@mui/icons-material/Star";
import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Checkbox,
  FormControlLabel,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useEffect, useMemo, useState } from "react";
import type { PromptVersion } from "../types";
import { useStore } from "../state/store";
import { getLatestVersion } from "./versioning";
import { extractTemplateVariables, substituteTemplateVariables } from "./templateVariables";

const byVersionDesc = (a: PromptVersion, b: PromptVersion) => b.version - a.version;

export function PromptDetailView() {
  const prompts = useStore((state) => state.prompts);
  const selectedPromptId = useStore((state) => state.selectedPromptId);
  const detailInitialVersionNumber = useStore((state) => state.detailInitialVersionNumber);
  const closePromptDetail = useStore((state) => state.closePromptDetail);
  const insertIntoComposer = useStore((state) => state.insertIntoComposer);
  const incrementUsage = useStore((state) => state.incrementUsage);
  const favorites = useStore((state) => state.favorites);
  const togglePromptFavorite = useStore((state) => state.togglePromptFavorite);
  const toggleVersionFavorite = useStore((state) => state.toggleVersionFavorite);
  const hasAttachedFile = useStore((state) => state.hasAttachedFile);
  const [selectedVersionNumber, setSelectedVersionNumber] = useState<number | null>(detailInitialVersionNumber);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [useAttachedFileForContext, setUseAttachedFileForContext] = useState(false);

  const prompt = useMemo(
    () => prompts.find((candidate) => candidate.id === selectedPromptId) ?? null,
    [prompts, selectedPromptId],
  );

  const activeVersion = useMemo(() => {
    if (!prompt) return null;

    if (prompt.versions?.length) {
      const latest = getLatestVersion(prompt);
      const resolvedVersionNumber = selectedVersionNumber ?? latest.version;

      return prompt.versions.find((version) => version.version === resolvedVersionNumber) ?? latest;
    }

    return getLatestVersion(prompt);
  }, [prompt, selectedVersionNumber]);


  const templateVariables = useMemo(
    () => (activeVersion ? extractTemplateVariables(activeVersion.content) : []),
    [activeVersion],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVariableValues({});
    setUseAttachedFileForContext(false);
  }, [prompt?.id, activeVersion?.id]);

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
  const latestVersionNumber = getLatestVersion(prompt).version;
  const isLatestVersion = activeVersion.version === latestVersionNumber;
  const menuOpen = Boolean(anchorEl);
  const activeVersionFavorited = isLatestVersion
    ? favorites.some((fav) => fav.promptId === prompt.id && fav.version == null)
    : favorites.some((fav) => fav.promptId === prompt.id && fav.version === activeVersion.version);

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
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
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
                          setSelectedVersionNumber(version.version);
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

            {prompt.versions?.length ? (
              <Tooltip title="Favorite this version">
                <IconButton
                  size="small"
                  aria-label={`Favorite version v${activeVersion.version} of ${prompt.title}`}
                  onClick={() => isLatestVersion
                    ? togglePromptFavorite(prompt.id)
                    : toggleVersionFavorite(prompt.id, activeVersion.version)
                  }
                >
                  {activeVersionFavorited ? <StarIcon fontSize="small" color="warning" /> : <StarBorderIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            ) : null}
          </Stack>

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

          {templateVariables.length > 0 && (
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" color="text.secondary">
                Prompt Inputs
              </Typography>
              {templateVariables.map((variable) => {
                if (variable.isContext) {
                  const contextValue = variableValues[variable.token] ?? "";

                  return (
                    <Stack key={variable.token} spacing={1}>
                      <FormControlLabel
                        control={(
                          <Checkbox
                            checked={useAttachedFileForContext}
                            onChange={(event) => setUseAttachedFileForContext(event.target.checked)}
                            disabled={!hasAttachedFile}
                            inputProps={{ "aria-label": "Use attached file as context" }}
                          />
                        )}
                        label="Use attached file as context"
                      />
                      {!hasAttachedFile && (
                        <Typography variant="caption" color="text.secondary">
                          No file attached
                        </Typography>
                      )}
                      {!useAttachedFileForContext && (
                        <TextField
                          label="Context"
                          value={contextValue}
                          onChange={(event) =>
                            setVariableValues((prev) => ({
                              ...prev,
                              [variable.token]: event.target.value,
                            }))
                          }
                          multiline
                          minRows={4}
                          fullWidth
                          size="small"
                        />
                      )}
                    </Stack>
                  );
                }

                const label = variable.token
                  .toLowerCase()
                  .split(" ")
                  .filter(Boolean)
                  .map((word) => word[0].toUpperCase() + word.slice(1))
                  .join(" ");

                return (
                  <TextField
                    key={variable.token}
                    label={label || variable.token}
                    value={variableValues[variable.token] ?? ""}
                    onChange={(event) =>
                      setVariableValues((prev) => ({
                        ...prev,
                        [variable.token]: event.target.value,
                      }))
                    }
                    fullWidth
                    size="small"
                  />
                );
              })}
            </Stack>
          )}
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
            const finalPrompt = substituteTemplateVariables(activeVersion.content, variableValues, {
              useAttachedFileForContext,
              attachedFilePlaceholder: "[Attached file context]",
            });

            insertIntoComposer(finalPrompt);
            incrementUsage(prompt.id);
          }}
        >
          ← INSERT PROMPT
        </Button>
      </Box>
    </Box>
  );
}
