import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ShortTextIcon from "@mui/icons-material/ShortText";
import SubjectIcon from "@mui/icons-material/Subject";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useEffect, useMemo, useState } from "react";
import { getLatestVersion, getPublishedVersion } from "../promptBank/versioning";
import { parseTemplateVariables } from "../promptBank/templateVariables";
import { useStore } from "../state/store";
import type { Prompt, PromptVersion } from "../types";
import { formatLastUpdated } from "./promptManagerSelectors";
import { PromptStatusChip } from "./PromptStatusChip";
import { PromptTestPanel } from "./PromptTestPanel";

interface PromptEditorProps {
  prompt: Prompt;
  onBack: () => void;
}

const INLINE_VERSION_COUNT = 5;

export function PromptEditor({ prompt, onBack }: PromptEditorProps) {
  const savePromptDraft = useStore((state) => state.savePromptDraft);
  const publishPrompt = useStore((state) => state.publishPrompt);
  const savePromptAsNewVersion = useStore((state) => state.savePromptAsNewVersion);
  const deletePrompt = useStore((state) => state.deletePrompt);
  const restorePrompt = useStore((state) => state.restorePrompt);
  const setPromptEditorUnsavedChanges = useStore((state) => state.setPromptEditorUnsavedChanges);

  const [title, setTitle] = useState(prompt.title);
  const [description, setDescription] = useState(prompt.description ?? "");
  const [promptInstructions, setPromptInstructions] = useState(prompt.desiredOutcome ?? "");
  const [content, setContent] = useState(prompt.content);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewAllVersionsOpen, setViewAllVersionsOpen] = useState(false);
  const [versionMenuAnchor, setVersionMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedVersion, setSelectedVersion] = useState<PromptVersion | null>(null);

  const { variables: templateVariables, invalidTokens } = useMemo(() => parseTemplateVariables(content), [content]);

  const latestVersion = getLatestVersion(prompt);
  const publishedVersion = prompt.publishedVersionId ? getPublishedVersion(prompt) : null;
  const sortedVersions = useMemo(
    () => [...(prompt.versions ?? [])].sort((a, b) => b.version - a.version),
    [prompt.versions],
  );
  const versionCount = sortedVersions.length;

  const isDirty =
    title !== prompt.title ||
    description !== (prompt.description ?? "") ||
    promptInstructions !== (prompt.desiredOutcome ?? "") ||
    content !== prompt.content;

  useEffect(() => {
    setPromptEditorUnsavedChanges(isDirty);
    return () => setPromptEditorUnsavedChanges(false);
  }, [isDirty, setPromptEditorUnsavedChanges]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const showFeedback = (msg: string) => {
    setSavedFeedback(msg);
    setTimeout(() => setSavedFeedback(null), 3000);
  };

  const buildPayload = () => ({
    title: title.trim() || "Untitled Prompt",
    description: description.trim() || undefined,
    desiredOutcome: promptInstructions.trim() || undefined,
    tags: prompt.tags,
    content,
  });

  const handleSaveDraft = () => {
    savePromptDraft(prompt.id, buildPayload());
    showFeedback("Draft saved.");
  };

  const handlePublishConfirm = () => {
    publishPrompt(prompt.id, buildPayload());
    setPublishDialogOpen(false);
    showFeedback(prompt.status === "published" ? "Changes published." : "Prompt published.");
  };

  const handleSaveAsNewVersion = (version?: PromptVersion) => {
    savePromptAsNewVersion(prompt.id, {
      description: (version?.description ?? description).trim() || undefined,
      desiredOutcome: (version?.desiredOutcome ?? promptInstructions).trim() || undefined,
      content: version?.content ?? content,
    });
    showFeedback("New version created.");
  };

  const handleDeleteConfirm = () => {
    deletePrompt(prompt.id);
    setDeleteDialogOpen(false);
    onBack();
  };

  const handleBack = () => {
    if (isDirty && !window.confirm("You have unsaved changes. Leave without saving?")) {
      return;
    }
    onBack();
  };

  const handleViewVersion = (version: PromptVersion) => {
    setContent(version.content);
    setDescription(version.description ?? "");
    setPromptInstructions(version.desiredOutcome ?? "");
    setVersionMenuAnchor(null);
    setViewAllVersionsOpen(false);
  };

  const inlineVersions = useMemo(() => {
    if (sortedVersions.length <= INLINE_VERSION_COUNT) return sortedVersions;

    const latest = sortedVersions[0];
    const published = sortedVersions.find((version) => version.id === prompt.publishedVersionId);
    const selectedIds = new Set<string>([latest.id]);
    const results: PromptVersion[] = [latest];

    if (published && !selectedIds.has(published.id)) {
      selectedIds.add(published.id);
      results.push(published);
    }

    for (const version of sortedVersions) {
      if (results.length >= INLINE_VERSION_COUNT) break;
      if (selectedIds.has(version.id)) continue;
      selectedIds.add(version.id);
      results.push(version);
    }

    return results.sort((a, b) => b.version - a.version);
  }, [sortedVersions, prompt.publishedVersionId]);

  const VersionRow = ({ version }: { version: PromptVersion }) => {
    const isPublished = version.id === prompt.publishedVersionId;
    const isLatest = version.version === latestVersion.version;

    return (
      <Box
        key={version.id}
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 1.5,
          p: 1.5,
          borderRadius: 1,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Box flex={1} minWidth={0}>
          <Stack direction="row" alignItems="center" gap={0.75} flexWrap="wrap">
            <Typography variant="body2" fontWeight={600}>
              v{version.version}
            </Typography>
            {isPublished && <Chip label="Published" size="small" color="success" variant="outlined" />}
            {isLatest && <Chip label="Latest" size="small" variant="outlined" />}
          </Stack>
          {version.description && (
            <Typography variant="caption" color="text.secondary" display="block" mt={0.25}>
              {version.description}
            </Typography>
          )}
          {version.createdAt && (
            <Typography variant="caption" color="text.disabled">
              {new Date(version.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
            </Typography>
          )}
        </Box>

        {isLatest ? (
          <Button size="small" variant="contained" onClick={() => handleSaveAsNewVersion()}>
            Save as new version
          </Button>
        ) : (
          <>
            <Button size="small" variant="outlined" onClick={() => handleViewVersion(version)}>
              View
            </Button>
            <IconButton
              size="small"
              aria-label={`Version ${version.version} actions`}
              onClick={(event) => {
                setSelectedVersion(version);
                setVersionMenuAnchor(event.currentTarget);
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </>
        )}
      </Box>
    );
  };

  return (
    <Box display="flex" flexDirection="column" height="100%" minHeight={0}>
      <Box
        px={2}
        py={1.5}
        borderBottom={1}
        borderColor="divider"
        display="flex"
        alignItems="center"
        gap={1.5}
        flexShrink={0}
        flexWrap="wrap"
      >
        <Tooltip title="Back to Prompt Manager">
          <IconButton size="small" onClick={handleBack} aria-label="Back to Prompt Manager">
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>

        <Stack direction="row" alignItems="center" gap={1} sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={600} noWrap>
            {(title || "Untitled Prompt")} v{latestVersion.version}
          </Typography>
          {(prompt.status === "draft" || prompt.status === "archived") && (
            <PromptStatusChip status={prompt.status} hasUnpublishedChanges={prompt.hasUnpublishedChanges} />
          )}
        </Stack>

        <Button
          size="small"
          variant="outlined"
          onClick={() => setShowTestPanel((prev) => !prev)}
        >
          Test Prompt
        </Button>
      </Box>

      <Box flex={1} minHeight={0} display="flex" flexDirection={{ xs: "column", lg: "row" }} overflow="hidden">
        <Box flex={1} minWidth={0} overflow="auto">
          <Box maxWidth={800} mx="auto" px={3} py={3}>
            <Stack spacing={4}>
              {savedFeedback && <Alert severity="success" sx={{ py: 0.5 }}>{savedFeedback}</Alert>}

              <Stack spacing={2}>
                <Typography variant="overline" color="text.secondary" letterSpacing={1}>
                  Metadata
                </Typography>

                <TextField
                  label="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  fullWidth
                  required
                  inputProps={{ "aria-label": "Prompt title" }}
                />

                <TextField
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  fullWidth
                  multiline
                  minRows={2}
                  maxRows={4}
                  helperText="A brief summary of what this prompt does."
                />
              </Stack>

              <Divider />

              <Stack spacing={1.5}>
                <Typography variant="overline" color="text.secondary" letterSpacing={1}>
                  Tags
                </Typography>
                {prompt.tags.length > 0 ? (
                  <Stack direction="row" gap={0.75} flexWrap="wrap">
                    {prompt.tags.map((tag) => (
                      <Chip key={tag} label={tag} size="small" />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No tags added yet.
                  </Typography>
                )}
              </Stack>

              <Divider />

              <Stack spacing={2}>
                <Typography variant="overline" color="text.secondary" letterSpacing={1}>
                  Prompt Template
                </Typography>

                <TextField
                  label="Template"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  fullWidth
                  multiline
                  minRows={4}
                  maxRows={16}
                  placeholder="Write your prompt template here…"
                  inputProps={{ "aria-label": "Prompt template content", style: { fontFamily: "monospace", fontSize: "0.875rem" } }}
                  error={invalidTokens.length > 0}
                  sx={{
                    "& .MuiInputBase-inputMultiline": {
                      maxHeight: "40vh",
                      overflowY: "auto !important",
                      resize: "none",
                    },
                  }}
                />

                <TextField
                  label="Prompt Instructions"
                  value={promptInstructions}
                  onChange={(e) => setPromptInstructions(e.target.value)}
                  fullWidth
                  multiline
                  minRows={3}
                  maxRows={12}
                  helperText="Define how the AI should respond (format, tone, limits)."
                  sx={{
                    "& .MuiInputBase-inputMultiline": {
                      maxHeight: "25vh",
                      overflowY: "auto !important",
                      resize: "none",
                    },
                  }}
                />

                <Typography variant="caption" color="text.secondary">
                  Template = structure + tokens. Prompt Instructions = response behavior.
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  Use <code>[TOKEN]</code> for short input, <code>[[TOKEN]]</code> for multi-line input, and <code>[CONTEXT]</code> for file context.
                </Typography>

                {invalidTokens.length > 0 && (
                  <Alert severity="error">
                    {invalidTokens.map((invalidToken) => (
                      <Typography key={`${invalidToken.raw}-${invalidToken.message}`} variant="body2">
                        <code>{invalidToken.raw}</code> — {invalidToken.message}
                      </Typography>
                    ))}
                  </Alert>
                )}
              </Stack>

              <Divider />

              <Stack spacing={1.5}>
                <Typography variant="overline" color="text.secondary" letterSpacing={1}>
                  Detected Variables
                </Typography>

                {templateVariables.length > 0 ? (
                  <>
                    <Stack direction="row" gap={1} flexWrap="wrap">
                      {templateVariables.map((variable) => (
                        <Tooltip
                          key={variable.token}
                          title={
                            variable.type === "context"
                              ? "Attachment variable"
                              : variable.type === "textarea"
                                ? "Multi-line variable"
                                : "Single-line variable"
                          }
                        >
                          <Chip
                            icon={
                              variable.type === "context"
                                ? <AttachFileIcon />
                                : variable.type === "textarea"
                                  ? <SubjectIcon />
                                  : <ShortTextIcon />
                            }
                            label={`${variable.token} — ${
                              variable.type === "context"
                                ? "Attachment"
                                : variable.type === "textarea"
                                  ? "Multi-line"
                                  : "Single-line"
                            }`}
                            size="small"
                            color={variable.type === "context" ? "info" : variable.type === "textarea" ? "secondary" : "default"}
                            variant={variable.type === "text" ? "outlined" : "filled"}
                            aria-label={
                              variable.type === "context"
                                ? "Attachment variable"
                                : variable.type === "textarea"
                                  ? "Multi-line variable"
                                  : "Single-line variable"
                            }
                            sx={variable.type === "text" ? {
                              fontFamily: "monospace",
                              borderColor: "text.disabled",
                            } : {}}
                          />
                        </Tooltip>
                      ))}
                    </Stack>

                    {templateVariables.some((v) => v.isContext) && (
                      <Box p={1.5} borderRadius={1.5} sx={{ bgcolor: (theme) => alpha(theme.palette.info.main, 0.08) }}>
                        <Typography variant="caption" color="text.secondary">
                          <strong>[CONTEXT]</strong> — When inserted into chat, this token lets users attach a file as context before sending.
                        </Typography>
                      </Box>
                    )}

                    {templateVariables.every((v) => !v.isContext) && (
                      <Typography variant="caption" color="text.secondary">
                        These variables will appear as input fields when users insert this prompt into chat.
                      </Typography>
                    )}
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No variables detected. Add <code>[TOKEN]</code> or <code>[[TOKEN]]</code> placeholders to make this prompt dynamic.
                  </Typography>
                )}
              </Stack>

              <Divider />

              <Stack spacing={1.5}>
                <Typography variant="overline" color="text.secondary" letterSpacing={1}>
                  Versions
                </Typography>

                <Stack spacing={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Working version:</strong> {versionCount === 0 ? "v1 (unsaved)" : `v${latestVersion.version} (latest)`}
                  </Typography>

                  {publishedVersion && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Published version:</strong> v{publishedVersion.version}
                      {prompt.hasUnpublishedChanges && (
                        <Typography component="span" variant="caption" color="info.main" ml={1}>
                          (library is showing this version)
                        </Typography>
                      )}
                    </Typography>
                  )}

                  <Typography variant="body2" color="text.secondary">
                    {versionCount === 0 ? "No versions saved yet." : `${versionCount} version${versionCount === 1 ? "" : "s"} total.`}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    Last updated {formatLastUpdated(prompt)}
                  </Typography>
                </Stack>

                {versionCount > 0 && (
                  <Stack spacing={1}>
                    {inlineVersions.map((version) => (
                      <VersionRow key={version.id} version={version} />
                    ))}
                    {versionCount > inlineVersions.length && (
                      <Button variant="text" sx={{ alignSelf: "flex-start" }} onClick={() => setViewAllVersionsOpen(true)}>
                        View all versions
                      </Button>
                    )}
                  </Stack>
                )}
              </Stack>
            </Stack>
          </Box>
        </Box>
        {showTestPanel && <PromptTestPanel template={content} onClose={() => setShowTestPanel(false)} />}
      </Box>

      <Box
        px={3}
        py={2}
        borderTop={1}
        borderColor="divider"
        bgcolor="background.default"
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap={1.5}
        flexShrink={0}
        flexWrap="wrap"
        position="sticky"
        bottom={0}
        zIndex={1}
      >
        {prompt.status === "draft" && (
          <>
            <Stack direction="row" gap={1}>
              <Button variant="outlined" onClick={handleSaveDraft} disabled={!isDirty}>
                Save Draft
              </Button>
              <Button variant="outlined" color="error" onClick={() => setDeleteDialogOpen(true)}>
                Delete
              </Button>
            </Stack>
            <Button variant="contained" color="primary" onClick={() => setPublishDialogOpen(true)} disabled={!content.trim()}>
              Publish
            </Button>
          </>
        )}

        {prompt.status === "published" && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleSaveAsNewVersion()}
            disabled={!content.trim()}
            sx={{ ml: "auto" }}
          >
            Create New Version
          </Button>
        )}

        {prompt.status === "archived" && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => restorePrompt(prompt.id)}
            sx={{ ml: "auto" }}
          >
            Restore
          </Button>
        )}
      </Box>

      <Dialog open={publishDialogOpen} onClose={() => setPublishDialogOpen(false)}>
        <DialogTitle>Publish new version?</DialogTitle>
        <DialogContent>
          <DialogContentText>This will create a new immutable version.</DialogContentText>
          <DialogContentText>Published versions cannot be edited or deleted.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPublishDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handlePublishConfirm}>Publish</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete prompt?</DialogTitle>
        <DialogContent>
          <DialogContentText>This prompt draft will be permanently removed.</DialogContentText>
          <DialogContentText sx={{ mt: 0.5 }}>Versions inside this draft will also be removed.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteConfirm}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={viewAllVersionsOpen} onClose={() => setViewAllVersionsOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>All Versions</DialogTitle>
        <DialogContent>
          <Stack spacing={1} mt={0.5}>
            {sortedVersions.map((version) => (
              <VersionRow key={`modal-${version.id}`} version={version} />
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewAllVersionsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Menu
        anchorEl={versionMenuAnchor}
        open={Boolean(versionMenuAnchor)}
        onClose={() => setVersionMenuAnchor(null)}
        MenuListProps={{ "aria-label": "Version actions" }}
      >
        <MenuItem onClick={() => selectedVersion && handleViewVersion(selectedVersion)}>
          View
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedVersion) {
              handleSaveAsNewVersion(selectedVersion);
            }
            setVersionMenuAnchor(null);
          }}
        >
          Save as new version
        </MenuItem>
        {selectedVersion && selectedVersion.id !== prompt.publishedVersionId && (
          <MenuItem
            onClick={() => {
              publishPrompt(prompt.id, {
                title: title.trim() || "Untitled Prompt",
                description: selectedVersion.description,
                desiredOutcome: selectedVersion.desiredOutcome,
                tags: prompt.tags,
                content: selectedVersion.content,
              });
              setVersionMenuAnchor(null);
              showFeedback("Prompt published.");
            }}
          >
            Publish this version
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}
