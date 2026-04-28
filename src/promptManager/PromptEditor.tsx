import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CheckIcon from "@mui/icons-material/Check";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
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
import { useEffect, useMemo, useState } from "react";
import { isPromptMine } from "../promptBank/access";
import { getLatestVersion, getNextVersionNumber, getPublishedVersion } from "../promptBank/versioning";
import { parseTemplateVariables } from "../promptBank/templateVariables";
import { useStore } from "../state/store";
import type { Prompt, PromptVersion } from "../types";
import { formatLastUpdated } from "./promptManagerSelectors";
import { PromptSettingsPanel } from "./PromptSettingsPanel";
import { PromptStatusChip } from "./PromptStatusChip";
import { PromptTestPanel } from "./PromptTestPanel";

interface PromptEditorProps {
  prompt: Prompt;
  onBack: () => void;
}

type EditorMode = "draft-edit" | "published-readonly" | "version-readonly" | "archived-readonly";

const INLINE_VERSION_COUNT = 4;
const TEMPLATE_EXAMPLE_DISMISSED_KEY = "prompt-manager-template-example-dismissed";

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
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);
  const [unsavedDialogAction, setUnsavedDialogAction] = useState<"back" | "switch-version">("back");
  const [pendingVersionSelection, setPendingVersionSelection] = useState<PromptVersion | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ title?: string; template?: string }>({});
  const [viewAllVersionsOpen, setViewAllVersionsOpen] = useState(false);
  const [headerVersionMenuAnchor, setHeaderVersionMenuAnchor] = useState<null | HTMLElement>(null);
  const [versionMenuAnchorPosition, setVersionMenuAnchorPosition] = useState<{ top: number; left: number } | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<PromptVersion | null>(null);
  const [templateExampleDismissed, setTemplateExampleDismissed] = useState<boolean>(() => localStorage.getItem(TEMPLATE_EXAMPLE_DISMISSED_KEY) === "true");
  const [showTemplateExampleForSession, setShowTemplateExampleForSession] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  const publishedVersion = prompt.publishedVersionId ? getPublishedVersion(prompt) : null;
  const hasVersionHistory = (prompt.versions?.length ?? 0) > 0;
  const latestVersion = getLatestVersion(prompt);
  const workingDraftVersionNumber = prompt.status === "draft" ? getNextVersionNumber(prompt) : null;
  const hasDraft = prompt.status === "draft";
  const promptVisibility = prompt.visibility ?? "private";
  const sharedUsers = prompt.sharedWith?.users ?? [];
  const isSharedWithNoUsers = promptVisibility === "shared" && sharedUsers.length === 0;
  const canManageSettings = isPromptMine(prompt);
  const viewingWorkingDraft = viewingVersion != null && workingDraftVersionNumber != null && viewingVersion.version === workingDraftVersionNumber;

  const editorMode: EditorMode = useMemo(() => {
    if (viewingVersion && !viewingWorkingDraft) return "version-readonly";
    if (prompt.status === "archived") return "archived-readonly";
    if (hasDraft) return "draft-edit";
    return "published-readonly";
  }, [hasDraft, prompt.status, viewingVersion, viewingWorkingDraft]);

  const activeSource = viewingVersion ?? {
    id: "working-copy",
    version: workingDraftVersionNumber ?? getLatestVersion(prompt).version,
    content: draftFormState.content,
    description: draftFormState.description || undefined,
    desiredOutcome: draftFormState.promptInstructions || undefined,
    createdAt: prompt.lastUpdatedAt ?? prompt.createdAt,
  };

  const isReadOnly = editorMode !== "draft-edit";
  const useReadOnlyControls = editorMode === "published-readonly" || editorMode === "version-readonly";
  const disableControls = editorMode === "archived-readonly";
  const showTemplateExample = !isReadOnly && (!templateExampleDismissed || showTemplateExampleForSession);
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

  const buildPayload = () => ({
    title: draftFormState.title.trim() || "Untitled Prompt",
    description: draftFormState.description.trim() || undefined,
    desiredOutcome: draftFormState.promptInstructions.trim() || undefined,
    tags: prompt.tags,
    content: draftFormState.content,
  });

  const validateRequiredFields = () => {
    const nextErrors: { title?: string; template?: string } = {};
    if (!draftFormState.title.trim()) {
      nextErrors.title = "Title is required.";
    }
    if (!draftFormState.content.trim()) {
      nextErrors.template = "Template is required.";
    }
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSaveDraft = () => {
    if (!validateRequiredFields()) {
      return;
    }
    savePromptDraft(prompt.id, buildPayload());
    setPromptManagerNotice("Draft saved");
  };

  const handlePublishConfirm = () => {
    if (!validateRequiredFields()) {
      setPublishDialogOpen(false);
      return;
    }
    publishPrompt(prompt.id, buildPayload());
    setPublishDialogOpen(false);
    setPromptManagerNotice("Prompt published");
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
    setPromptManagerNotice("New version created");
  };

  const handleDeleteConfirm = () => {
    if (hasVersionHistory || prompt.publishedVersionId) {
      discardPromptDraft(prompt.id);
      setPromptManagerNotice("Draft deleted");
    } else {
      deletePrompt(prompt.id);
      setPromptManagerNotice("Prompt deleted");
    }
    setDeleteDialogOpen(false);
    onBack();
  };

  const applyVersionSelection = (version: PromptVersion | null) => {
    setViewingVersion(version);
    setPendingVersionSelection(null);
    setHeaderVersionMenuAnchor(null);
    setVersionMenuAnchorPosition(null);
    setViewAllVersionsOpen(false);
  };

  const requestVersionSelection = (version: PromptVersion | null) => {
    if (!isReadOnly && isDirty) {
      setPendingVersionSelection(version);
      setUnsavedDialogAction("switch-version");
      setUnsavedDialogOpen(true);
      setHeaderVersionMenuAnchor(null);
      setVersionMenuAnchorPosition(null);
      return;
    }
    applyVersionSelection(version);
  };

  const handleBack = () => {
    if (!isReadOnly && isDirty) {
      setUnsavedDialogAction("back");
      setUnsavedDialogOpen(true);
      return;
    }
    onBack();
  };

  const handleDismissTemplateExample = () => {
    setTemplateExampleDismissed(true);
    setShowTemplateExampleForSession(false);
    localStorage.setItem(TEMPLATE_EXAMPLE_DISMISSED_KEY, "true");
  };

  const handleShowTemplateExample = () => {
    setShowTemplateExampleForSession(true);
  };

  const toggleSettingsPanel = () => {
    setShowSettingsPanel((prev) => !prev);
    setShowTestPanel(false);
  };

  const inlineVersions = useMemo(() => {
    return sortedVersions.slice(0, INLINE_VERSION_COUNT);
  }, [sortedVersions]);
  const versionMenuOpen = Boolean(headerVersionMenuAnchor);
  const canSelectVersionFromHeader = prompt.status !== "archived";
  const showHeaderVersionDropdown = canSelectVersionFromHeader && versionCount > 1;
  const headerVersionOptions = useMemo(() => sortedVersions.slice(0, 5), [sortedVersions]);

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
            <Typography variant="caption" color="text.secondary">
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
            {draftFormState.title || "Untitled Prompt"}
          </Typography>
          {showHeaderVersionDropdown ? (
            <Button
              size="small"
              variant="text"
              onClick={(event) => setHeaderVersionMenuAnchor(event.currentTarget)}
              aria-haspopup="menu"
              aria-expanded={versionMenuOpen ? "true" : undefined}
              aria-label={`Select version, currently v${activeSource.version}`}
              endIcon={<ExpandMoreIcon fontSize="small" />}
              sx={{
                minWidth: 0,
                px: 1,
                py: 0.25,
                borderRadius: 999,
                bgcolor: "action.hover",
                color: "text.primary",
                fontWeight: 600,
                textTransform: "none",
                "&:hover": { bgcolor: "action.selected" },
              }}
            >
              v{activeSource.version}
            </Button>
          ) : (
            <Typography
              variant="body2"
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: 999,
                bgcolor: "action.hover",
                color: "text.primary",
                fontWeight: 600,
              }}
            >
              v{activeSource.version}
            </Typography>
          )}
          {(editorMode === "draft-edit" || editorMode === "archived-readonly") && (
            <PromptStatusChip status={prompt.status} hasUnpublishedChanges={prompt.hasUnpublishedChanges} />
          )}
          {editorMode === "version-readonly" && <Chip label="Read-only" size="small" variant="outlined" />}
        </Stack>

      </Box>

      <Box flex={1} minHeight={0} display="flex" flexDirection={{ xs: "column", lg: "row" }} overflow="hidden">
        <Box flex={1} minWidth={0} overflow="auto">
          <Box maxWidth={800} mx="auto" px={3} py={3}>
            <Stack spacing={4}>
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
                  onChange={(e) => {
                    setDraftFormState((prev) => ({ ...prev, title: e.target.value }));
                    setFieldErrors((prev) => ({ ...prev, title: undefined }));
                  }}
                  disabled={disableControls}
                  fullWidth
                  required
                  inputProps={{ "aria-label": "Prompt title" }}
                  InputProps={{ readOnly: useReadOnlyControls }}
                  error={Boolean(fieldErrors.title)}
                  helperText={fieldErrors.title}
                />

                <TextField
                  label="Description"
                  value={isReadOnly ? (activeSource.description ?? "") : draftFormState.description}
                  onChange={(e) => setDraftFormState((prev) => ({ ...prev, description: e.target.value }))}
                  disabled={disableControls}
                  InputProps={{ readOnly: useReadOnlyControls }}
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

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 1.25,
                    py: 1,
                    borderRadius: 1.25,
                    bgcolor: "action.selected",
                  }}
                >
                  <InfoOutlinedIcon fontSize="small" color="primary" aria-hidden="true" />
                  <Typography component="div" variant="body2" color="text.primary">
                    <strong>Template</strong> is the prompt sent to the AI. <strong>Prompt Instructions</strong> tells the AI how to respond.{" "}
                    {!isReadOnly && (
                      <Button
                        variant="text"
                        size="small"
                        onClick={handleShowTemplateExample}
                        sx={{ p: 0, minWidth: 0, textTransform: "none", fontWeight: 600, verticalAlign: "baseline" }}
                      >
                        See example
                      </Button>
                    )}
                  </Typography>
                </Box>

                {showTemplateExample && (
                  <Box
                    sx={{
                      border: "1px solid",
                      borderColor: "action.selected",
                      borderRadius: 1.5,
                      p: 1.25,
                      bgcolor: "background.default",
                    }}
                  >
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Typography variant="overline" color="text.secondary" letterSpacing={1}>
                          Example
                        </Typography>
                        <Button
                          variant="text"
                          size="small"
                          onClick={handleDismissTemplateExample}
                          sx={{ p: 0, minWidth: 0, textTransform: "none" }}
                          aria-label="Dismiss template example"
                        >
                          Dismiss
                        </Button>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        Template
                      </Typography>
                      <Box
                        sx={{
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 1,
                          px: 1.25,
                          py: 0.875,
                          bgcolor: "background.default",
                          fontFamily: "monospace",
                          fontSize: "0.875rem",
                        }}
                      >
                        Summarize [[ARTICLE]] in plain language.
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Prompt Instructions
                      </Typography>
                      <Box
                        sx={{
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 1,
                          px: 1.25,
                          py: 0.875,
                          bgcolor: "background.default",
                          fontFamily: "monospace",
                          fontSize: "0.875rem",
                        }}
                      >
                        Use 3 bullets max. Avoid jargon.
                      </Box>
                    </Stack>
                  </Box>
                )}

                <Stack direction="row" alignItems="baseline" spacing={0.75}>
                  <Typography component="label" htmlFor="prompt-template-field" variant="body2" fontWeight={600}>
                    Template *
                  </Typography>
                  <Typography id="template-sub-label" variant="caption" color="text.secondary">
                    — the prompt sent to the AI
                  </Typography>
                </Stack>

                <TextField
                  id="prompt-template-field"
                  value={activeSource.content}
                  onChange={(e) => {
                    setDraftFormState((prev) => ({ ...prev, content: e.target.value }));
                    setFieldErrors((prev) => ({ ...prev, template: undefined }));
                  }}
                  disabled={disableControls}
                  InputProps={{ readOnly: useReadOnlyControls }}
                  fullWidth
                  required
                  multiline
                  minRows={6}
                  maxRows={16}
                  placeholder="Write your prompt template here…"
                  inputProps={{
                    "aria-label": "Prompt template content",
                    "aria-describedby": "template-sub-label",
                    "aria-required": true,
                    style: { fontFamily: "monospace", fontSize: "0.875rem" },
                  }}
                  error={invalidTokens.length > 0 || Boolean(fieldErrors.template)}
                  helperText={fieldErrors.template}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                      "& fieldset": { borderColor: "secondary.main" },
                      "&.Mui-focused fieldset": { borderWidth: 2 },
                    },
                    "& .MuiInputBase-inputMultiline": {
                      minHeight: "140px",
                      maxHeight: "40vh",
                      overflowY: "auto !important",
                      resize: "none",
                    },
                  }}
                />

                <Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "flex-start", md: "center" }} justifyContent="space-between" gap={0.5}>
                  <Stack direction="row" gap={1} flexWrap="wrap">
                    {[
                      { token: "[VARIABLE]", description: "short input" },
                      { token: "[[VARIABLE]]", description: "multi-line" },
                      { token: "[CONTEXT]", description: "file attachment" },
                    ].map((tokenItem) => (
                      <Stack key={tokenItem.token} direction="row" spacing={0.5} alignItems="center">
                        <Box
                          component="span"
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            px: 0.75,
                            py: 0.25,
                            borderRadius: 999,
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: "action.hover",
                            fontFamily: "monospace",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                          }}
                        >
                          {tokenItem.token}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {tokenItem.description}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                  <Typography variant="caption" color="text.secondary" aria-live="polite" sx={{ lineHeight: 1.2, alignSelf: "center" }}>
                    {templateVariables.length === 0
                      ? "No variables yet"
                      : templateVariables.length === 1
                        ? "1 variable detected"
                        : `${templateVariables.length} variables detected`}
                  </Typography>
                </Stack>

                <Stack direction="row" alignItems="baseline" spacing={0.75}>
                  <Typography component="label" htmlFor="prompt-instructions-field" variant="body2" fontWeight={600}>
                    Prompt Instructions
                  </Typography>
                  <Typography id="prompt-instructions-sub-label" variant="caption" color="text.secondary">
                    — optional, how the AI should respond
                  </Typography>
                </Stack>

                <TextField
                  id="prompt-instructions-field"
                  value={isReadOnly ? (activeSource.desiredOutcome ?? "") : draftFormState.promptInstructions}
                  onChange={(e) => setDraftFormState((prev) => ({ ...prev, promptInstructions: e.target.value }))}
                  disabled={disableControls}
                  InputProps={{ readOnly: useReadOnlyControls }}
                  fullWidth
                  multiline
                  minRows={3}
                  maxRows={12}
                  inputProps={{
                    "aria-label": "Prompt instructions",
                    "aria-describedby": "prompt-instructions-sub-label prompt-instructions-helper",
                    style: { fontFamily: "inherit" },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                      "& fieldset": { borderColor: "divider" },
                    },
                    "& .MuiInputBase-inputMultiline": {
                      minHeight: "72px",
                      maxHeight: "25vh",
                      overflowY: "auto !important",
                      resize: "none",
                    },
                  }}
                />

                <Typography id="prompt-instructions-helper" variant="caption" color="text.secondary" sx={{ mt: -0.5 }}>
                  Examples: "Use bullet points, max 5." · "Professional tone." · "Keep it under 200 words."
                </Typography>

                {invalidTokens.length > 0 && (
                  <Alert severity="error" role="status" aria-live="polite">
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

                    <Typography variant="caption" color="text.secondary">
                      These variables will appear as input fields when users insert this prompt into chat.
                    </Typography>
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No variables detected.
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
        {canManageSettings && showSettingsPanel && <PromptSettingsPanel prompt={prompt} onClose={() => setShowSettingsPanel(false)} />}
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
            <Button variant="outlined" color="error" onClick={() => setDeleteDialogOpen(true)}>
              {(hasVersionHistory || prompt.publishedVersionId) ? "Delete Draft" : "Delete Prompt"}
            </Button>
            <Stack direction="row" gap={1.5} ml="auto" flexWrap="wrap">
              <Button variant="outlined" onClick={handleSaveDraft} disabled={!isDirty}>
                Save Draft
              </Button>
              <Button variant="outlined" onClick={() => setShowTestPanel((prev) => !prev)}>
                Test Prompt
              </Button>
              <Button
                variant="contained"
                color="primary"
                disabled={isSharedWithNoUsers}
                onClick={() => {
                  if (!validateRequiredFields()) {
                    return;
                  }
                  setPublishDialogOpen(true);
                }}
              >
                Publish
              </Button>
            </Stack>
          </>
        )}

        {(editorMode === "published-readonly" || editorMode === "version-readonly") && (
          <Stack direction="row" gap={1.5} ml="auto" flexWrap="wrap">
            <Button variant="outlined" onClick={() => setShowTestPanel((prev) => !prev)}>
              Test Prompt
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleCreateNewVersion()}
            >
              Create New Version
            </Button>
          </Stack>
        )}

        {editorMode === "archived-readonly" && (
          <Stack direction="row" gap={1.5} ml="auto" flexWrap="wrap">
            <Button variant="outlined" onClick={() => setShowTestPanel((prev) => !prev)}>
              Test Prompt
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                restorePrompt(prompt.id);
                setPromptManagerNotice("Prompt restored");
              }}
            >
              Restore
            </Button>
          </Stack>
        )}

        {canManageSettings && (
          <Button variant="outlined" onClick={toggleSettingsPanel}>
            Settings
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
          <Button variant="contained" color="primary" disabled={isSharedWithNoUsers} onClick={handlePublishConfirm}>Publish</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} aria-labelledby="delete-dialog-title">
        <DialogTitle id="delete-dialog-title">{(hasVersionHistory || prompt.publishedVersionId) ? "Delete draft?" : "Delete prompt?"}</DialogTitle>
        <DialogContent>
          {(hasVersionHistory || prompt.publishedVersionId) ? (
            <DialogContentText>
              Delete draft removes current unpublished changes only.
            </DialogContentText>
          ) : (
            <DialogContentText>Delete prompt removes the entire prompt and all versions.</DialogContentText>
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
                applyVersionSelection(null);
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
            <MenuItem onClick={() => selectedVersion && requestVersionSelection(selectedVersion)}>
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

      <Menu
        anchorEl={headerVersionMenuAnchor}
        open={versionMenuOpen}
        onClose={() => setHeaderVersionMenuAnchor(null)}
        MenuListProps={{ "aria-label": "Prompt versions" }}
      >
        {hasDraft && workingDraftVersionNumber != null && (
          <MenuItem
            selected={!viewingVersion}
            onClick={() => requestVersionSelection(null)}
            sx={{ minWidth: 180, display: "flex", justifyContent: "space-between", gap: 1 }}
          >
            <span>v{workingDraftVersionNumber} — Draft</span>
            {!viewingVersion ? <CheckIcon fontSize="small" color="primary" /> : null}
          </MenuItem>
        )}
        {headerVersionOptions.map((version) => {
          const isActiveVersion = activeSource.version === version.version;
          return (
            <MenuItem
              key={`header-version-${version.id}`}
              selected={isActiveVersion}
              onClick={() => requestVersionSelection(version)}
              sx={{ minWidth: 180, display: "flex", justifyContent: "space-between", gap: 1 }}
            >
              <span>v{version.version}</span>
              {isActiveVersion ? <CheckIcon fontSize="small" color="primary" /> : null}
            </MenuItem>
          );
        })}
        <MenuItem
          onClick={() => {
            setHeaderVersionMenuAnchor(null);
            setViewAllVersionsOpen(true);
          }}
        >
          View all versions
        </MenuItem>
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
              if (unsavedDialogAction === "switch-version") {
                applyVersionSelection(pendingVersionSelection);
                return;
              }
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
