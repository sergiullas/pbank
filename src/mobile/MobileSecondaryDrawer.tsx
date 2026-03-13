import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import StarIcon from "@mui/icons-material/Star";
import {
  Box,
  Button,
  Chip,
  Divider,
  FormControlLabel,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Checkbox,
  Tooltip,
  Typography,
  Drawer,
  useTheme,
} from "@mui/material";
import { useMemo, useState } from "react";
import { alpha } from "@mui/material/styles";
import type { Prompt, PromptVersion } from "../types";
import { useStore } from "../state/store";
import { getLatestVersion } from "../promptBank/versioning";
import { extractTemplateVariables, substituteTemplateVariables } from "../promptBank/templateVariables";

interface MobileSecondaryDrawerProps {
  open: boolean;
  onClose: () => void;
}

type MobilePromptView = "list" | "detail";

const parseCreatedAt = (createdAt: string): number => {
  const parsed = Date.parse(createdAt);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const getRelevanceScore = (prompt: Prompt, query: string): number => {
  const normalizedQuery = query.toLowerCase();
  if (!normalizedQuery) return 0;

  let score = 0;
  if (prompt.title.toLowerCase().includes(normalizedQuery)) score += 3;
  if (prompt.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))) score += 2;
  if (prompt.description?.toLowerCase().includes(normalizedQuery)) score += 1;
  if (prompt.content.toLowerCase().includes(normalizedQuery)) score += 1;

  return score;
};

const sortByRelevance = (prompts: Prompt[], query: string): Prompt[] => {
  return [...prompts]
    .map((prompt) => ({
      prompt,
      relevanceScore: getRelevanceScore(prompt, query),
      createdAtMs: parseCreatedAt(prompt.createdAt),
    }))
    .filter((item) => item.relevanceScore > 0)
    .sort((a, b) => (
      b.relevanceScore - a.relevanceScore
      || b.prompt.likes - a.prompt.likes
      || b.createdAtMs - a.createdAtMs
    ))
    .map((item) => item.prompt);
};

const sortPromptsForMobile = (prompts: Prompt[]): Prompt[] => {
  return [...prompts].sort((a, b) => b.likes - a.likes || parseCreatedAt(b.createdAt) - parseCreatedAt(a.createdAt));
};

const promptMatchesQuery = (prompt: Prompt, normalizedQuery: string): boolean => {
  if (!normalizedQuery) return true;

  return (
    prompt.title.toLowerCase().includes(normalizedQuery)
    || prompt.content.toLowerCase().includes(normalizedQuery)
    || prompt.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
    || Boolean(prompt.description?.toLowerCase().includes(normalizedQuery))
  );
};

const byVersionDesc = (a: PromptVersion, b: PromptVersion) => b.version - a.version;

export function MobileSecondaryDrawer({ open, onClose }: MobileSecondaryDrawerProps) {
  const theme = useTheme();
  const prompts = useStore((state) => state.prompts);
  const favorites = useStore((state) => state.favorites);
  const promptQuery = useStore((state) => state.promptQuery);
  const setPromptQuery = useStore((state) => state.setPromptQuery);
  const togglePromptFavorite = useStore((state) => state.togglePromptFavorite);
  const toggleVersionFavorite = useStore((state) => state.toggleVersionFavorite);
  const insertIntoComposer = useStore((state) => state.insertIntoComposer);
  const incrementUsage = useStore((state) => state.incrementUsage);

  const [mobileView, setMobileView] = useState<MobilePromptView>("list");
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [selectedVersionNumber, setSelectedVersionNumber] = useState<number | null>(null);
  const [versionMenuAnchor, setVersionMenuAnchor] = useState<null | HTMLElement>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [useAttachedFileForContext, setUseAttachedFileForContext] = useState(false);

  const resetDetailState = () => {
    setSelectedPromptId(null);
    setSelectedVersionNumber(null);
    setVersionMenuAnchor(null);
    setVariableValues({});
    setUseAttachedFileForContext(false);
  };


  const selectedPrompt = useMemo(
    () => prompts.find((prompt) => prompt.id === selectedPromptId) ?? null,
    [prompts, selectedPromptId],
  );

  const activeVersion = useMemo(() => {
    if (!selectedPrompt) return null;

    if (selectedPrompt.versions?.length) {
      const latest = getLatestVersion(selectedPrompt);
      const resolvedVersionNumber = selectedVersionNumber ?? latest.version;
      return selectedPrompt.versions.find((version) => version.version === resolvedVersionNumber) ?? latest;
    }

    return getLatestVersion(selectedPrompt);
  }, [selectedPrompt, selectedVersionNumber]);

  const templateVariables = useMemo(
    () => (activeVersion ? extractTemplateVariables(activeVersion.content) : []),
    [activeVersion],
  );

  const visiblePrompts = useMemo(() => {
    const normalizedQuery = promptQuery.trim().toLowerCase();
    const filtered = prompts.filter((prompt) => promptMatchesQuery(prompt, normalizedQuery));

    if (normalizedQuery) return sortByRelevance(filtered, normalizedQuery);
    return sortPromptsForMobile(filtered);
  }, [prompts, promptQuery]);

  const latestVersionNumber = selectedPrompt ? getLatestVersion(selectedPrompt).version : null;
  const isLatestVersion = latestVersionNumber != null && activeVersion?.version === latestVersionNumber;
  const activeVersionFavorited = selectedPrompt && activeVersion
    ? (isLatestVersion
      ? favorites.some((favorite) => favorite.promptId === selectedPrompt.id && favorite.version == null)
      : favorites.some((favorite) => favorite.promptId === selectedPrompt.id && favorite.version === activeVersion.version))
    : false;

  const closeDrawer = () => {
    resetDetailState();
    setMobileView("list");
    onClose();
  };

  const insertActivePrompt = () => {
    if (!selectedPrompt || !activeVersion) return;

    const finalPrompt = substituteTemplateVariables(activeVersion.content, variableValues, {
      useAttachedFileForContext,
      attachedFilePlaceholder: "[Attached file context]",
    });

    insertIntoComposer(finalPrompt, { requiresAttachment: useAttachedFileForContext });
    incrementUsage(selectedPrompt.id);
    closeDrawer();
  };

  return (
    <Drawer
      anchor="right"
      variant="temporary"
      open={open}
      onClose={closeDrawer}
      aria-label="Prompt Library drawer"
      sx={{
        zIndex: theme.zIndex.drawer,
        "& .MuiDrawer-paper": {
          width: "88vw",
          maxWidth: 420,
          backgroundColor: theme.palette.background.default,
        },
      }}
    >
      <Box display="flex" flexDirection="column" height="100%">
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          px={1}
          py={1}
          borderBottom={1}
          borderColor="divider"
          bgcolor="background.paper"
          position="sticky"
          top={0}
          zIndex={1}
        >
          {mobileView === "detail" ? (
            <IconButton
              onClick={() => {
                setMobileView("list");
                resetDetailState();
              }}
              aria-label="Back to prompt list"
              size="small"
            >
              <ArrowBackIcon />
            </IconButton>
          ) : (
            <Box width={32} />
          )}

          <Typography variant="subtitle1" fontWeight={600} noWrap>
            Prompt Library
          </Typography>

          {mobileView === "list" ? (
            <IconButton onClick={closeDrawer} aria-label="Close prompt library drawer" size="small">
              <CloseIcon />
            </IconButton>
          ) : (
            <Box width={32} />
          )}
        </Box>

        {mobileView === "list" ? (
          <>
            <Box p={2} borderBottom={1} borderColor="divider" bgcolor="background.paper" position="sticky" top={49} zIndex={1}>
              <TextField
                fullWidth
                size="small"
                label="Search prompts"
                placeholder="Search prompts"
                value={promptQuery}
                onChange={(event) => setPromptQuery(event.target.value)}
                autoFocus
              />
            </Box>

            <Box flex={1} minHeight={0} overflow="auto" aria-label="Prompt list">
              {visiblePrompts.length === 0 ? (
                <Box p={2}>
                  <Typography variant="body2" color="text.secondary">No prompts found.</Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {visiblePrompts.map((prompt) => {
                    const latestVersion = getLatestVersion(prompt);
                    const promptFavorited = favorites.some((favorite) => favorite.promptId === prompt.id && favorite.version == null);

                    return (
                      <ListItemButton
                        key={prompt.id}
                        alignItems="flex-start"
                        onClick={() => {
                          setSelectedPromptId(prompt.id);
                          setSelectedVersionNumber(null);
                          setVariableValues({});
                          setUseAttachedFileForContext(false);
                          setMobileView("detail");
                        }}
                        sx={{ borderBottom: "1px solid", borderColor: "divider", py: 1.5 }}
                      >
                        <ListItemText
                          primary={(
                            <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={1}>
                              <Typography fontWeight={600}>{prompt.title}</Typography>
                              <Tooltip title={promptFavorited ? "Remove from favorites" : "Add to favorites"}>
                                <IconButton
                                  edge="end"
                                  size="small"
                                  aria-label={promptFavorited ? "Remove from favorites" : "Add to favorites"}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    togglePromptFavorite(prompt.id);
                                  }}
                                >
                                  {promptFavorited ? <StarIcon fontSize="small" color="warning" /> : <StarBorderIcon fontSize="small" />}
                                </IconButton>
                              </Tooltip>
                            </Box>
                          )}
                          secondary={(
                            <Stack spacing={0.75} mt={0.75}>
                              <Typography variant="body2" color="text.secondary">
                                {prompt.description ?? "No description available."}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                by {prompt.owner} · v{latestVersion.version}
                              </Typography>
                            </Stack>
                          )}
                        />
                      </ListItemButton>
                    );
                  })}
                </List>
              )}
            </Box>
          </>
        ) : (
          <>
            <Box flex={1} minHeight={0} overflow="auto" p={2}>
              {!selectedPrompt || !activeVersion ? (
                <Typography variant="body2" color="text.secondary">Select a prompt to preview details.</Typography>
              ) : (
                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                    <Typography variant="h6">{selectedPrompt.title}</Typography>
                    <IconButton
                      size="small"
                      aria-label={activeVersionFavorited ? "Remove from favorites" : "Add to favorites"}
                      onClick={() => {
                        if (isLatestVersion) {
                          togglePromptFavorite(selectedPrompt.id);
                        } else {
                          toggleVersionFavorite(selectedPrompt.id, activeVersion.version);
                        }
                      }}
                    >
                      {activeVersionFavorited ? <StarIcon fontSize="small" color="warning" /> : <StarBorderIcon fontSize="small" />}
                    </IconButton>
                  </Stack>

                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">by {selectedPrompt.owner}</Typography>
                    {selectedPrompt.versions?.length ? (
                      <>
                        <Button
                          variant="text"
                          size="small"
                          aria-label="Select prompt version"
                          aria-haspopup="menu"
                          aria-expanded={versionMenuAnchor ? "true" : undefined}
                          onClick={(event) => setVersionMenuAnchor(event.currentTarget)}
                          sx={{ textTransform: "none", minWidth: 0, p: 0, color: "text.secondary" }}
                        >
                          v{activeVersion.version}{isLatestVersion ? " (Latest)" : ""}
                        </Button>
                        <Menu
                          anchorEl={versionMenuAnchor}
                          open={Boolean(versionMenuAnchor)}
                          onClose={() => setVersionMenuAnchor(null)}
                          MenuListProps={{ "aria-label": "Prompt versions" }}
                        >
                          {[...selectedPrompt.versions].sort(byVersionDesc).map((version) => (
                            <MenuItem
                              key={version.id}
                              selected={version.version === activeVersion.version}
                              onClick={() => {
                                setSelectedVersionNumber(version.version);
                                setVersionMenuAnchor(null);
                                setVariableValues({});
                                setUseAttachedFileForContext(false);
                              }}
                            >
                              v{version.version}{version.version === latestVersionNumber ? " (Latest)" : ""}
                            </MenuItem>
                          ))}
                        </Menu>
                      </>
                    ) : null}
                  </Stack>

                  {activeVersion.description && (
                    <Typography variant="body2" color="text.secondary">{activeVersion.description}</Typography>
                  )}

                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                    {selectedPrompt.tags.map((tag) => (
                      <Chip key={tag} label={tag} size="small" />
                    ))}
                  </Stack>

                  {templateVariables.length > 0 && (
                    <Box p={1.5} borderRadius={2} sx={{ bgcolor: (paletteTheme) => alpha(paletteTheme.palette.info.main, 0.1) }}>
                      <Typography variant="caption" color="text.secondary">
                        Contains variables · Requires input before sending
                      </Typography>
                    </Box>
                  )}

                  {templateVariables.some((variable) => variable.isContext) && (
                    <Box p={1.5} borderRadius={2} sx={{ bgcolor: (paletteTheme) => alpha(paletteTheme.palette.warning.main, 0.1) }}>
                      <Typography variant="caption" color="text.secondary">Includes [CONTEXT]</Typography>
                    </Box>
                  )}

                  <Box p={2} borderRadius={2} bgcolor="grey.100" maxHeight={260} overflow="auto">
                    <Typography variant="body2" whiteSpace="pre-wrap">{activeVersion.content}</Typography>
                  </Box>

                  {templateVariables.length > 0 && (
                    <Stack spacing={1.5}>
                      <Typography variant="subtitle2" color="text.secondary">Prompt Inputs</Typography>
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
                                    inputProps={{ "aria-label": "Use attached file as context" }}
                                  />
                                )}
                                label="Use attached file as context"
                              />
                              {useAttachedFileForContext ? (
                                <Typography variant="caption" color="warning.main">
                                  An attached file will be required when sending this prompt.
                                </Typography>
                              ) : (
                                <TextField
                                  label="Context"
                                  multiline
                                  minRows={3}
                                  maxRows={6}
                                  fullWidth
                                  value={contextValue}
                                  onChange={(event) => setVariableValues((prev) => ({ ...prev, [variable.token]: event.target.value }))}
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
                            onChange={(event) => setVariableValues((prev) => ({ ...prev, [variable.token]: event.target.value }))}
                            fullWidth
                            size="small"
                          />
                        );
                      })}
                    </Stack>
                  )}
                </Stack>
              )}
            </Box>

            <Divider />
            <Box p={2} bgcolor="background.paper" position="sticky" bottom={0}>
              <Button
                variant="contained"
                fullWidth
                onClick={insertActivePrompt}
                disabled={!selectedPrompt || !activeVersion}
                aria-label="Insert into chat"
              >
                Insert into chat
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Drawer>
  );
}
