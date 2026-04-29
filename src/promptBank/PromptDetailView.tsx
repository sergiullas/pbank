import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckIcon from "@mui/icons-material/Check";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import StarIcon from "@mui/icons-material/Star";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { useEffect, useMemo, useState } from "react";
import type { PromptVersion } from "../types";
import { useStore } from "../state/store";
import { userHasPromptAccess } from "./access";
import { getLatestVersion, resolveInitialLibraryVersion } from "./versioning";
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
  const toggleVersionFavorite = useStore((state) => state.toggleVersionFavorite);

  // Resolve initial version using priority: explicit → version-specific favorite → published → latest.
  // Lazy initializer runs once at mount; the component is keyed so it remounts on prompt change.
  const [selectedVersionNumber, setSelectedVersionNumber] = useState<number | null>(() => {
    const prompt = prompts.find((p) => p.id === selectedPromptId) ?? null;
    return resolveInitialLibraryVersion(prompt, favorites, detailInitialVersionNumber);
  });

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [allVersionsOpen, setAllVersionsOpen] = useState(false);
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

  const hasAccess = prompt ? userHasPromptAccess(prompt) : false;


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

  if (!hasAccess) {
    return (
      <Box p={2}>
        <Typography variant="body2" color="text.secondary">
          You no longer have access to this prompt.
        </Typography>
      </Box>
    );
  }

  const sortedVersions = prompt.versions ? [...prompt.versions].sort(byVersionDesc) : [];
  const menuVersions = sortedVersions.slice(0, 5);
  const menuOpen = Boolean(anchorEl);

  const activeVersionFavorited = favorites.some((fav) => fav.promptId === prompt.id && fav.version === activeVersion.version);

  const activeVersionLabel = `v${activeVersion.version}`;

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
                    {activeVersionLabel}
                  </Button>
                  <Menu
                    anchorEl={anchorEl}
                    open={menuOpen}
                    onClose={() => setAnchorEl(null)}
                    MenuListProps={{ "aria-label": "Prompt versions" }}
                  >
                    {menuVersions.map((version) => {
                      const isActiveVersion = version.version === activeVersion.version;
                      return (
                        <MenuItem
                          key={version.id}
                          selected={isActiveVersion}
                          onClick={() => {
                            setSelectedVersionNumber(version.version);
                            setAnchorEl(null);
                          }}
                          sx={{ display: "flex", justifyContent: "space-between", gap: 1, minWidth: 140 }}
                        >
                          <span>v{version.version}</span>
                          {isActiveVersion ? <CheckIcon fontSize="small" color="primary" /> : null}
                        </MenuItem>
                      );
                    })}
                    {sortedVersions.length > 5 && (
                      <MenuItem
                        onClick={() => {
                          setAnchorEl(null);
                          setAllVersionsOpen(true);
                        }}
                      >
                        View all versions
                      </MenuItem>
                    )}
                  </Menu>
                </>
              ) : null}
            </Box>

            {prompt.versions?.length ? (
              <Tooltip title="Favorite this version">
                <IconButton
                  size="small"
                  aria-label={`Favorite version v${activeVersion.version} of ${prompt.title}`}
                  disabled={!activeVersionFavorited && prompt.status === "archived"}
                  onClick={() => toggleVersionFavorite(prompt.id, activeVersion.version)}
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
              Tags
            </Typography>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              {prompt.tags.map((tag) => (
                <Chip key={tag} label={tag} size="small" />
              ))}
            </Stack>
          </Stack>

          <Divider sx={{ my: 0.5 }} />

          <Stack spacing={1}>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
              Prompt Template
            </Typography>
            <Box p={2} bgcolor="background.surface" borderRadius={2}>
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
                            inputProps={{ "aria-label": "Use attached file as context" }}
                          />
                        )}
                        label="Use attached file as context"
                      />
                      {useAttachedFileForContext && (
                        <Typography variant="caption" color="warning.main">
                          An attached file will be required when sending this prompt.
                        </Typography>
                      )}
                      {!useAttachedFileForContext && (
                        <TextField
                          label="Context"
                          multiline
                          minRows={4}
                          maxRows={10}
                          fullWidth
                          value={contextValue}
                          onChange={(event) =>
                            setVariableValues((prev) => ({
                              ...prev,
                              [variable.token]: event.target.value,
                            }))
                          }
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
                    multiline={variable.type === "textarea"}
                    minRows={variable.type === "textarea" ? 2 : 1}
                    maxRows={variable.type === "textarea" ? 8 : 1}
                    sx={variable.type === "textarea" ? {
                      "& .MuiInputBase-inputMultiline": {
                        maxHeight: "25vh",
                        overflowY: "auto !important",
                        resize: "none",
                      },
                    } : undefined}
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

            insertIntoComposer(finalPrompt, { requiresAttachment: useAttachedFileForContext });
            incrementUsage(prompt.id);
          }}
        >
          ← INSERT PROMPT
        </Button>
      </Box>

      <Dialog open={allVersionsOpen} onClose={() => setAllVersionsOpen(false)} fullWidth maxWidth="xs" aria-labelledby="library-all-versions-title">
        <DialogTitle id="library-all-versions-title">All Versions</DialogTitle>
        <DialogContent>
          <Stack spacing={0.5}>
            {sortedVersions.map((version) => {
              const isActiveVersion = version.version === activeVersion.version;
              return (
                <Button
                  key={`all-version-${version.id}`}
                  variant={isActiveVersion ? "contained" : "text"}
                  onClick={() => {
                    setSelectedVersionNumber(version.version);
                    setAllVersionsOpen(false);
                  }}
                  sx={{ justifyContent: "space-between", textTransform: "none" }}
                  endIcon={isActiveVersion ? <CheckIcon fontSize="small" /> : undefined}
                >
                  v{version.version}
                </Button>
              );
            })}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAllVersionsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
