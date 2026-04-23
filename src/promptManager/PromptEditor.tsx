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

type EditorMode = "draft-edit" | "published-readonly" | "version-readonly" | "archived-readonly";

const INLINE_VERSION_COUNT = 4;

export function PromptEditor({ prompt, onBack }: PromptEditorProps) {
  const savePromptDraft = useStore((state) => state.savePromptDraft);
  const publishPrompt = useStore((state) => state.publishPrompt);
  const savePromptAsNewVersion = useStore((state) => state.savePromptAsNewVersion);
  const discardPromptDraft = useStore((state) => state.discardPromptDraft);
  const deletePrompt = useStore((state) => state.deletePrompt);
  const restorePrompt = useStore((state) => state.restorePrompt);
  const setPromptEditorUnsavedChanges = useStore((state) => state.setPromptEditorUnsavedChanges);
  const setPromptManagerNotice = useStore((state) => state.setPromptManagerNotice);

  const [draftFormState, setDraftFormState] = useState(() => ({
    title: prompt.title,
    description: prompt.description ?? "",
    promptInstructions: prompt.desiredOutcome ?? "",
    content: prompt.content,
  }));
  const [viewingVersion, setViewingVersion] = useState<PromptVersion | null>(null);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);
  const [viewAllVersionsOpen, setViewAllVersionsOpen] = useState(false);
  const [versionMenuAnchorPosition, setVersionMenuAnchorPosition] = useState<{ top: number; left: number } | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<PromptVersion | null>(null);

  const publishedVersion = prompt.publishedVersionId ? getPublishedVersion(prompt) : null;
  const hasVersionHistory = (prompt.versions?.length ?? 0) > 0;
  const latestVersion = getLatestVersion(prompt);
  const workingDraftVersionNumber = prompt.status === "draft"
    ? ((prompt.versions?.length ?? 0) === 0 ? 1 : latestVersion.version)
    : null;
  const hasDraft = prompt.status === "draft";
  const viewingWorkingDraft = viewingVersion != null && workingDraftVersionNumber != null && viewingVersion.version === workingDraftVersionNumber;

  const editorMode: EditorMode = useMemo(() => {
    if (viewingVersion && !viewingWorkingDraft) return "version-readonly";
    if (prompt.status === "archived") return "archived-readonly";
    if (hasDraft) return "draft-edit";
    return "published-readonly";
  }, [hasDraft, prompt.status, viewingVersion, viewingWorkingDraft]);

  const activeSource = viewingVersion ?? {
    id: "working-copy",
    version: getLatestVersion(prompt).version,
    content: draftFormState.content,
    description: draftFormState.description || undefined,
    desiredOutcome: draftFormState.promptInstructions || undefined,
    createdAt: prompt.lastUpdatedAt ?? prompt.createdAt,
  };

  const isReadOnly = editorMode !== "draft-edit";
  const { variables: templateVariables, invalidTokens } = useMemo(
    () => parseTemplateVariables(activeSource.content),
    [activeSource.content],
  );

  const sortedVersions = useMemo(
    () => [...(prompt.versions ?? [])].sort((a, b) => b.version - a.version),
    [prompt.versions],
  );
  const versionCount = sortedVersions.length;

  const isDirty =
    draftFormState.title !== prompt.title ||
    draftFormState.description !== (prompt.description ?? "") ||
    draftFormState.promptInstructions !== (prompt.desiredOutcome ?? "") ||
    draftFormState.content !== prompt.content;

  useEffect(() => {
    setPromptEditorUnsavedChanges(isDirty);
    return () => setPromptEditorUnsavedChanges(false);
  }, [isDirty, setPromptEditorUnsavedChanges]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (!isDirty || isReadOnly) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, isReadOnly]);

  const showFeedback = (msg: string) => {
    setSavedFeedback(msg);
    setTimeout(() => setSavedFeedback(null), 3000);
  };

  const buildPayload = () => ({
    title: draftFormState.title.trim() || "Untitled Prompt",
    description: draftFormState.description.trim() || undefined,
    desiredOutcome: draftFormState.promptInstructions.trim() || undefined,
    tags: prompt.tags,
    content: draftFormState.content,
  });

  const handleSaveDraft = () => {
    savePromptDraft(prompt.id, buildPayload());
    showFeedback("Draft saved.");
  };

  const handlePublishConfirm = () => {
    publishPrompt(prompt.id, buildPayload());
    setPublishDialogOpen(false);
    setPromptManagerNotice(prompt.status === "published" ? "Changes published." : "Prompt published.");
    onBack();
  };

  const handleCreateNewVersion = (version?: PromptVersion) => {
    if (hasDraft) return;
    const baseVersion = version ?? viewingVersion ?? publishedVersion ?? latestVersion;
    savePromptAsNewVersion(prompt.id, {
      description: (baseVersion.description ?? "").trim() || undefined,
      desiredOutcome: (baseVersion.desiredOutcome ?? "").trim() || undefined,
      content: baseVersion.content,
    });
    setViewingVersion(null);
    showFeedback("Draft opened from selected version.");
  };

  const handleDeleteConfirm = () => {
    if (hasVersionHistory || prompt.publishedVersionId) {
      discardPromptDraft(prompt.id);
      setPromptManagerNotice("Draft deleted.");
    } else {
      deletePrompt(prompt.id);
      setPromptManagerNotice("Prompt deleted.");
    }
    setDeleteDialogOpen(false);
    onBack();
  };

  const handleBack = () => {
    if (!isReadOnly && isDirty) {
      setUnsavedDialogOpen(true);
      return;
    }
    onBack();
  };

  const handleViewVersion = (version: PromptVersion) => {
    setViewingVersion(version);
    setVersionMenuAnchorPosition(null);
    setViewAllVersionsOpen(false);
  };

  const inlineVersions = useMemo(() => {
    return sortedVersions.slice(0, INLINE_VERSION_COUNT);
  }, [sortedVersions]);

  const VersionRow = ({ version }: { version: PromptVersion }) => {
    const isWorkingDraft = workingDraftVersionNumber != null && version.version === workingDraftVersionNumber;

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
            {isWorkingDraft && <Chip label="Draft" size="small" variant="outlined" />}
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

        <IconButton
          size="small"
          aria-label={`Version ${version.version} actions`}
          onClick={(event) => {
            setSelectedVersion(version);
            setVersionMenuAnchorPosition({ top: event.clientY, left: event.clientX });
          }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
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
            {(draftFormState.title || "Untitled Prompt")} v{activeSource.version}
          </Typography>
          {(editorMode === "draft-edit" || editorMode === "archived-readonly") && (
            <PromptStatusChip status={prompt.status} hasUnpublishedChanges={prompt.hasUnpublishedChanges} />
          )}
          {editorMode === "version-readonly" && <Chip label="Read-only" size="small" variant="outlined" />}
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
              {savedFeedback && <Alert severity="success" sx={{ py: 0.5 }} aria-live="polite">{savedFeedback}</Alert>}
              {editorMode === "published-readonly" && (
                <Alert severity="info" variant="outlined">
                  Read-only mode: published versions cannot be edited. Create a new version to make changes.
                </Alert>
              )}
              {editorMode === "version-readonly" && (
                <Alert severity="info" variant="outlined">
                  Read-only mode: you are viewing a historical version.
                </Alert>
              )}
              {editorMode === "archived-readonly" && (
                <Alert severity="warning" variant="outlined">
                  Archived status: this prompt is inactive until restored.
                </Alert>
              )}

              <Stack spacing={2}>
                <Typography variant="overline" color="text.secondary" letterSpacing={1}>
                  Metadata
                </Typography>

                <TextField
                  label="Title"
                  value={draftFormState.title}
                  onChange={(e) => setDraftFormState((prev) => ({ ...prev, title: e.target.value }))}
                  disabled={isReadOnly}
                  fullWidth
                  required
                  inputProps={{ "aria-label": "Prompt title" }}
                />

                <TextField
                  label="Description"
                  value={isReadOnly ? (activeSource.description ?? "") : draftFormState.description}
                  onChange={(e) => setDraftFormState((prev) => ({ ...prev, description: e.target.value }))}
                  disabled={isReadOnly}
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

                <Typography variant="caption" color="text.secondary" sx={{ mt: -0.5 }}>
                  Template = structure + tokens. Prompt Instructions = response behavior.
                </Typography>

                <TextField
                  label="Template"
                  value={activeSource.content}
                  onChange={(e) => setDraftFormState((prev) => ({ ...prev, content: e.target.value }))}
                  disabled={isReadOnly}
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

                <Typography variant="caption" color="text.secondary">
                  Use <code>[TOKEN]</code> for short input, <code>[[TOKEN]]</code> for multi-line input, and <code>[CONTEXT]</code> for file context.
                </Typography>

                <TextField
                  label="Prompt Instructions"
                  value={isReadOnly ? (activeSource.desiredOutcome ?? "") : draftFormState.promptInstructions}
                  onChange={(e) => setDraftFormState((prev) => ({ ...prev, promptInstructions: e.target.value }))}
                  disabled={isReadOnly}
                  fullWidth
                  multiline
                  minRows={3}
                  maxRows={12}
                  sx={{
                    "& .MuiInputBase-inputMultiline": {
                      maxHeight: "25vh",
                      overflowY: "auto !important",
                      resize: "none",
                    },
                  }}
                />

                <Typography variant="caption" color="text.secondary" sx={{ mt: -0.5 }}>
                  Define how the AI should respond (format, tone, limits).
                </Typography>

                {invalidTokens.length > 0 && (
                  <Alert severity="error" role="alert" aria-live="polite">
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
                    <strong>Working version:</strong>{" "}
                    {workingDraftVersionNumber == null ? "None" : (versionCount === 0 ? "v1 (unsaved)" : `v${workingDraftVersionNumber}`)}
                  </Typography>

                  {publishedVersion && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Published version:</strong> v{publishedVersion.version}
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
        {showTestPanel && <PromptTestPanel template={activeSource.content} onClose={() => setShowTestPanel(false)} />}
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
        {editorMode === "draft-edit" && (
          <>
            <Stack direction="row" gap={1}>
              <Button variant="outlined" onClick={handleSaveDraft} disabled={!isDirty}>
                Save Draft
              </Button>
              <Button variant="outlined" color="error" onClick={() => setDeleteDialogOpen(true)}>
                {(hasVersionHistory || prompt.publishedVersionId) ? "Delete Draft" : "Delete Prompt"}
              </Button>
            </Stack>
            <Button variant="contained" color="primary" onClick={() => setPublishDialogOpen(true)} disabled={!draftFormState.content.trim()}>
              Publish
            </Button>
            {!draftFormState.content.trim() && (
              <Typography variant="caption" color="text.secondary">
                Add template content to enable publishing.
              </Typography>
            )}
          </>
        )}

        {(editorMode === "published-readonly" || editorMode === "version-readonly") && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleCreateNewVersion()}
            sx={{ ml: "auto" }}
          >
            Create New Version
          </Button>
        )}

        {editorMode === "archived-readonly" && (
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

      <Dialog open={publishDialogOpen} onClose={() => setPublishDialogOpen(false)} aria-labelledby="publish-dialog-title">
        <DialogTitle id="publish-dialog-title">Publish new version?</DialogTitle>
        <DialogContent>
          <DialogContentText>This will create a new immutable version.</DialogContentText>
          <DialogContentText>Published versions cannot be edited or deleted.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPublishDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handlePublishConfirm}>Publish</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} aria-labelledby="delete-dialog-title">
        <DialogTitle id="delete-dialog-title">{(hasVersionHistory || prompt.publishedVersionId) ? "Delete draft?" : "Delete prompt?"}</DialogTitle>
        <DialogContent>
          {(hasVersionHistory || prompt.publishedVersionId) ? (
            <DialogContentText>
              This will remove your current unpublished changes. Previous versions will remain available.
            </DialogContentText>
          ) : (
            <DialogContentText>This will permanently remove this prompt.</DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteConfirm}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={viewAllVersionsOpen} onClose={() => setViewAllVersionsOpen(false)} fullWidth maxWidth="sm" aria-labelledby="all-versions-title">
        <DialogTitle id="all-versions-title">All Versions</DialogTitle>
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
        open={Boolean(versionMenuAnchorPosition)}
        onClose={() => setVersionMenuAnchorPosition(null)}
        anchorReference="anchorPosition"
        anchorPosition={versionMenuAnchorPosition ?? undefined}
        MenuListProps={{ "aria-label": "Version actions" }}
      >
        {selectedVersion && workingDraftVersionNumber != null && selectedVersion.version === workingDraftVersionNumber ? (
          <>
            <MenuItem
              onClick={() => {
                setViewingVersion(null);
                setVersionMenuAnchorPosition(null);
              }}
            >
              Edit
            </MenuItem>
            <MenuItem
              onClick={() => {
                setDeleteDialogOpen(true);
                setVersionMenuAnchorPosition(null);
              }}
              sx={{ color: "error.main" }}
            >
              Delete
            </MenuItem>
          </>
        ) : (
          <>
            <MenuItem onClick={() => selectedVersion && handleViewVersion(selectedVersion)}>
              View
            </MenuItem>
            <MenuItem
              onClick={() => {
                if (selectedVersion) {
                  handleCreateNewVersion(selectedVersion);
                }
                setVersionMenuAnchorPosition(null);
              }}
            >
              Create New Version
            </MenuItem>
          </>
        )}
      </Menu>

      <Dialog open={unsavedDialogOpen} onClose={() => setUnsavedDialogOpen(false)} aria-labelledby="unsaved-dialog-title">
        <DialogTitle id="unsaved-dialog-title">Discard unsaved changes?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have unsaved edits. If you leave now, your changes will be lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnsavedDialogOpen(false)}>Stay</Button>
          <Button
            color="warning"
            variant="contained"
            onClick={() => {
              setUnsavedDialogOpen(false);
              onBack();
            }}
          >
            Leave without saving
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
