import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import ShortTextIcon from "@mui/icons-material/ShortText";
import SubjectIcon from "@mui/icons-material/Subject";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  CircularProgress,
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
  Radio,
  RadioGroup,
  FormControlLabel,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { findDirectoryUserById, searchDirectoryUsers } from "../data/mockDirectory";
import { isPromptMine } from "../promptBank/access";
import { getLatestVersion, getNextVersionNumber, getPublishedVersion } from "../promptBank/versioning";
import { parseTemplateVariables } from "../promptBank/templateVariables";
import { useStore } from "../state/store";
import type { Prompt, PromptVersion, PromptVisibility } from "../types";
import { formatLastUpdated } from "./promptManagerSelectors";
import { PromptStatusChip } from "./PromptStatusChip";
import { PromptTestPanel } from "./PromptTestPanel";

interface PromptEditorProps {
  prompt: Prompt;
  onBack: () => void;
}

type EditorMode = "draft-edit" | "published-readonly" | "version-readonly" | "archived-readonly";

const INLINE_VERSION_COUNT = 4;
const TEMPLATE_HELPER_PREFERENCE_KEY = "promptManager.hideTemplateHelper";

export function PromptEditor({ prompt, onBack }: PromptEditorProps) {
  const savePromptDraft = useStore((state) => state.savePromptDraft);
  const publishPrompt = useStore((state) => state.publishPrompt);
  const savePromptAsNewVersion = useStore((state) => state.savePromptAsNewVersion);
  const updatePromptVisibility = useStore((state) => state.updatePromptVisibility);
  const updatePromptSharedUsers = useStore((state) => state.updatePromptSharedUsers);
  const discardPromptDraft = useStore((state) => state.discardPromptDraft);
  const deletePrompt = useStore((state) => state.deletePrompt);
  const restorePrompt = useStore((state) => state.restorePrompt);
  const setPromptEditorUnsavedChanges = useStore((state) => state.setPromptEditorUnsavedChanges);
  const setPromptManagerNotice = useStore((state) => state.setPromptManagerNotice);

  const [draftFormState, setDraftFormState] = useState(() => ({
    title: prompt.title,
    description: prompt.description ?? "",
    promptInstructions: prompt.desiredOutcome ?? "",
    tags: [...prompt.tags],
    content: prompt.content,
  }));
  const [viewingVersion, setViewingVersion] = useState<PromptVersion | null>(null);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);
  const [unsavedDialogAction, setUnsavedDialogAction] = useState<"back" | "switch-version">("back");
  const [pendingVersionSelection, setPendingVersionSelection] = useState<PromptVersion | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ title?: string; template?: string; versionComments?: string }>({});
  const [versionComments, setVersionComments] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [hideTemplateHelper, setHideTemplateHelper] = useState(() => window.localStorage.getItem(TEMPLATE_HELPER_PREFERENCE_KEY) === "true");
  const [viewAllVersionsOpen, setViewAllVersionsOpen] = useState(false);
  const [headerVersionMenuAnchor, setHeaderVersionMenuAnchor] = useState<null | HTMLElement>(null);
  const [versionMenuAnchorPosition, setVersionMenuAnchorPosition] = useState<{ top: number; left: number } | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<PromptVersion | null>(null);
  const [isTemplateExampleOpen, setIsTemplateExampleOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareDraftVisibility, setShareDraftVisibility] = useState<PromptVisibility>("private");
  const [shareDraftUsers, setShareDraftUsers] = useState<string[]>([]);
  const [shareQuery, setShareQuery] = useState("");
  const [shareResults, setShareResults] = useState<{ id: string; name: string; email: string }[]>([]);
  const [shareSearchLoading, setShareSearchLoading] = useState(false);
  const [shareFooterMode, setShareFooterMode] = useState<"default" | "discard-warning" | "downgrade-warning">("default");
  const [shareSaveError, setShareSaveError] = useState<string | null>(null);
  const [shareLiveMessage, setShareLiveMessage] = useState("");
  const shareFooterAlertRef = useRef<HTMLParagraphElement | null>(null);
  const shareButtonRef = useRef<HTMLButtonElement | null>(null);
  const shareSearchInputRef = useRef<HTMLInputElement | null>(null);
  const privateDescId = useId();
  const sharedDescId = useId();
  const publicDescId = useId();

  const publishedVersion = prompt.publishedVersionId ? getPublishedVersion(prompt) : null;
  const hasVersionHistory = (prompt.versions?.length ?? 0) > 0;
  const isTitleLocked = hasVersionHistory || prompt.publishedVersionId != null;
  const latestVersion = getLatestVersion(prompt);
  const workingDraftVersionNumber = prompt.status === "draft" ? getNextVersionNumber(prompt) : null;
  const hasDraft = prompt.status === "draft";
  const promptVisibility = prompt.visibility ?? "private";
  const sharedUsers = (prompt.sharedWith?.users ?? []).filter((userId) => userId !== prompt.creatorId);
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
  const showTemplateExample = !isReadOnly && isTemplateExampleOpen;
  const nextVersionNumber = getNextVersionNumber(prompt);
  const requireVersionComments = editorMode === "draft-edit" && nextVersionNumber >= 2;
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
    JSON.stringify(draftFormState.tags) !== JSON.stringify(prompt.tags) ||
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

  useEffect(() => {
    if (!shareModalOpen) return;
    const normalized = shareQuery.trim();
    if (normalized.length < 2) {
      setShareResults([]);
      setShareSearchLoading(false);
      return;
    }
    setShareSearchLoading(true);
    const timeoutId = window.setTimeout(() => {
      searchDirectoryUsers(normalized)
        .then((results) => setShareResults(results.filter((user) => user.id !== prompt.creatorId).slice(0, 8)))
        .finally(() => setShareSearchLoading(false));
    }, 250);
    return () => window.clearTimeout(timeoutId);
  }, [shareModalOpen, shareQuery]);

  const buildPayload = () => ({
    title: draftFormState.title.trim() || "Untitled Prompt",
    description: draftFormState.description.trim() || undefined,
    desiredOutcome: draftFormState.promptInstructions.trim() || undefined,
    tags: draftFormState.tags,
    content: draftFormState.content,
    changelog: versionComments.trim() ? [versionComments.trim()] : undefined,
  });

  const validateRequiredFields = () => {
    const nextErrors: { title?: string; template?: string; versionComments?: string } = {};
    if (!draftFormState.title.trim()) {
      nextErrors.title = "Title is required.";
    }
    if (!draftFormState.content.trim()) {
      nextErrors.template = "Template is required.";
    }
    if (requireVersionComments && !versionComments.trim()) {
      nextErrors.versionComments = "Version Comments are required for v2 and above.";
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
    if (hasDraft) {
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

  const handleToggleTemplateExample = () => {
    setIsTemplateExampleOpen((prev) => !prev);
  };
  const addTag = () => {
    const value = tagInput.trim();
    if (!value) return;
    setDraftFormState((prev) => (prev.tags.includes(value) ? prev : { ...prev, tags: [...prev.tags, value] }));
    setTagInput("");
  };

  const openShareModal = () => {
    setShareDraftVisibility(promptVisibility);
    setShareDraftUsers(sharedUsers);
    setShareQuery("");
    setShareResults([]);
    setShareSaveError(null);
    setShareFooterMode("default");
    setShareModalOpen(true);
  };
  const closeShareModal = () => {
    setShareModalOpen(false);
    setShareQuery("");
    setShareResults([]);
    setShareSaveError(null);
    setShareFooterMode("default");
    shareButtonRef.current?.focus();
  };
  const isShareDraftDirty = useMemo(() => {
    const sameVisibility = shareDraftVisibility === promptVisibility;
    const initialUsers = [...sharedUsers].sort();
    const currentUsers = [...shareDraftUsers].sort();
    return !(sameVisibility && initialUsers.length === currentUsers.length && initialUsers.every((id, index) => id === currentUsers[index]));
  }, [promptVisibility, shareDraftUsers, shareDraftVisibility, sharedUsers]);
  const requestShareModalClose = () => {
    if (shareFooterMode !== "default") return;
    if (!isShareDraftDirty) { closeShareModal(); return; }
    setShareFooterMode("discard-warning");
    setShareLiveMessage("Unsaved changes. Choose Keep Editing or Discard.");
  };
  const commitShareChanges = () => {
    try {
      updatePromptVisibility(prompt.id, { visibility: shareDraftVisibility });
      updatePromptSharedUsers(prompt.id, shareDraftVisibility === "shared" ? shareDraftUsers.filter((id) => id !== prompt.creatorId) : []);
      setPromptManagerNotice("Visibility updated");
      closeShareModal();
    } catch {
      setShareSaveError("Failed to update sharing. Please try again.");
      setShareFooterMode("default");
    }
  };
  const isVisibilityReduction = (
    (promptVisibility === "public" && (shareDraftVisibility === "shared" || shareDraftVisibility === "private"))
    || (promptVisibility === "shared" && shareDraftVisibility === "private")
  );
  const hasRemovedExistingSharedUsers = promptVisibility === "shared" && shareDraftVisibility === "shared" && sharedUsers.some((userId) => !shareDraftUsers.includes(userId));
  const showDowngradeWarning = isVisibilityReduction || hasRemovedExistingSharedUsers;
  const removedSharedUsersCount = sharedUsers.filter((userId) => !shareDraftUsers.includes(userId)).length;
  const downgradeWarningText = isVisibilityReduction
    ? "Reduces access for existing users"
    : `Reduces access for ${removedSharedUsersCount} ${removedSharedUsersCount === 1 ? "user" : "users"}`;
  useEffect(() => { if (shareFooterMode !== "default") shareFooterAlertRef.current?.focus(); }, [shareFooterMode]);
  useEffect(() => {
    if (!shareModalOpen) return;
    if (shareDraftVisibility === "shared") {
      setTimeout(() => shareSearchInputRef.current?.focus(), 0);
    }
  }, [shareDraftVisibility, shareModalOpen]);
  const shareButtonIcon = promptVisibility === "shared"
    ? <GroupOutlinedIcon fontSize="small" />
    : promptVisibility === "public"
      ? <PublicOutlinedIcon fontSize="small" />
      : <LockOutlinedIcon fontSize="small" />;
  const shareAriaLabel = promptVisibility === "shared"
    ? `Share — currently Shared with ${sharedUsers.length} people`
    : promptVisibility === "public"
      ? "Share — currently Public"
      : "Share — currently Private";

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
          {version.changelog?.length ? (
            <Typography variant="caption" color="text.secondary" display="block" mt={0.25}>
              {version.changelog.join(" ")}
            </Typography>
          ) : null}
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
        <Tooltip title="Back to Prompt Builder">
          <IconButton size="small" onClick={handleBack} aria-label="Back to Prompt Builder">
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>

        <Stack direction="row" alignItems="center" gap={1} sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={600} noWrap>
            {draftFormState.title.trim() || "Untitled Prompt"}
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

        <Stack direction="row" alignItems="center" spacing={1}>
          {canManageSettings && (
            <Button
              variant="outlined"
              size="small"
              startIcon={shareButtonIcon}
              onClick={openShareModal}
              aria-label={shareAriaLabel}
              ref={shareButtonRef}
            >
              Share
              {promptVisibility === "shared" && (
                <Box
                  component="span"
                  sx={{
                    ml: 0.75,
                    minWidth: 18,
                    height: 18,
                    px: 0.5,
                    borderRadius: 999,
                    bgcolor: "action.selected",
                    color: "text.secondary",
                    fontSize: "0.7rem",
                    lineHeight: "18px",
                    fontWeight: 700,
                    textAlign: "center",
                  }}
                >
                  {sharedUsers.length}
                </Box>
              )}
            </Button>
          )}
          <Button variant="outlined" size="small" onClick={() => setShowTestPanel((prev) => !prev)}>
            Test Prompt
          </Button>
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

                {isTitleLocked ? (
                  <Stack spacing={1.25} sx={{ pb: 0.5 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        Title
                      </Typography>
                      <Tooltip title="Title cannot be changed after a prompt is published." placement="top-start" arrow>
                        <Button
                          variant="text"
                          size="small"
                          sx={{ p: 0, minWidth: 0, textTransform: "none", fontWeight: 600, verticalAlign: "baseline" }}
                        >
                          Why can&apos;t I edit the title?
                        </Button>
                      </Tooltip>
                    </Stack>
                    <Box>
                      <Typography
                        variant="body1"
                        color={draftFormState.title.trim() ? "text.primary" : "text.secondary"}
                        fontStyle={draftFormState.title.trim() ? "normal" : "italic"}
                      >
                        {draftFormState.title.trim() || "Untitled Prompt"}
                      </Typography>
                    </Box>
                  </Stack>
                ) : (
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
                    error={Boolean(fieldErrors.title)}
                    helperText={fieldErrors.title}
                  />
                )}

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
                {requireVersionComments && (
                  <TextField
                    label="Version Comments"
                    value={versionComments}
                    onChange={(e) => {
                      setVersionComments(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, versionComments: undefined }));
                    }}
                    disabled={disableControls}
                    fullWidth
                    required
                    multiline
                    minRows={2}
                    maxRows={4}
                    error={Boolean(fieldErrors.versionComments)}
                    helperText={fieldErrors.versionComments ?? "Describe what changed in this version."}
                  />
                )}
              </Stack>

              <Divider />

              <Stack spacing={1.5}>
                <Typography variant="overline" color="text.secondary" letterSpacing={1}>
                  Tags
                </Typography>
                {!isReadOnly && (
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <TextField
                      label="Add tag"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addTag();
                        }
                      }}
                      disabled={disableControls}
                      size="small"
                    />
                    <Button variant="outlined" onClick={addTag} disabled={disableControls}>Add</Button>
                  </Stack>
                )}
                {draftFormState.tags.length > 0 ? (
                  <Stack direction="row" gap={0.75} flexWrap="wrap">
                    {draftFormState.tags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        onDelete={isReadOnly ? undefined : () => setDraftFormState((prev) => ({ ...prev, tags: prev.tags.filter((value) => value !== tag) }))}
                      />
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

                {!hideTemplateHelper && <Box
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
                  <Box sx={{ flex: 1 }}>
                    <Typography component="div" variant="body2" color="text.primary">
                      Wrap words in brackets to create fill-in-the-blank placeholders. These become input fields when the prompt is used.{" "}
                      {!isReadOnly && (
                        <Button
                          variant="text"
                          size="small"
                          onClick={handleToggleTemplateExample}
                          sx={{ p: 0, minWidth: 0, textTransform: "none", fontWeight: 600, verticalAlign: "baseline" }}
                        >
                          {showTemplateExample ? "Hide example" : "See example"}
                        </Button>
                      )}
                    </Typography>
                    <FormControlLabel
                      control={<Checkbox checked={hideTemplateHelper} />}
                      label="Do not show this again"
                      onChange={() => {
                        window.localStorage.setItem(TEMPLATE_HELPER_PREFERENCE_KEY, "true");
                        setHideTemplateHelper(true);
                      }}
                    />
                  </Box>
                  <IconButton size="small" aria-label="Dismiss template helper" onClick={() => setHideTemplateHelper(true)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>}

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
                        <IconButton size="small" onClick={handleToggleTemplateExample} aria-label="Close template example">
                          <CloseIcon fontSize="small" />
                        </IconButton>
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
              {hasDraft ? "Delete Draft" : "Delete Prompt"}
            </Button>
            <Stack direction="row" gap={1.5} ml="auto" flexWrap="wrap">
              <Button variant="outlined" onClick={handleSaveDraft} disabled={!isDirty}>
                Save Draft
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

      </Box>

      <Dialog
        open={shareModalOpen}
        onClose={(_, reason) => {
          if (reason === "backdropClick" || reason === "escapeKeyDown") {
            requestShareModalClose();
            return;
          }
          requestShareModalClose();
        }}
        fullWidth
        maxWidth="sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
        PaperProps={{ sx: { overflow: "hidden" } }}
      >
        <DialogTitle id="share-modal-title" sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Typography component="span" variant="h6">Share "{draftFormState.title.trim() || "Untitled Prompt"}"</Typography>
          <IconButton aria-label="Close share modal" onClick={requestShareModalClose} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ overflow: "hidden" }}>
          <Stack spacing={2}>
                        <Alert severity="info" variant="outlined">
              Sharing makes all published versions available in the Prompt Library to use. Drafts are never shared.
            </Alert>
            <RadioGroup
              aria-label="Who can find this prompt?"
              name="prompt-visibility"
              value={shareDraftVisibility}
              onChange={(event) => {
                setShareDraftVisibility(event.target.value as PromptVisibility);
                setShareSaveError(null);
                setShareFooterMode("default");
              }}
            >
              <FormControlLabel value="private" control={<Radio inputProps={{ "aria-describedby": privateDescId }} />} label={<><Typography variant="body2" fontWeight={600}>Private</Typography><Typography id={privateDescId} variant="caption" color="text.secondary">Only you can access this prompt.</Typography></>} />
              <FormControlLabel value="shared" control={<Radio inputProps={{ "aria-describedby": sharedDescId }} />} label={<><Typography variant="body2" fontWeight={600}>Shared</Typography><Typography id={sharedDescId} variant="caption" color="text.secondary">Specific people can access this prompt.</Typography></>} />
              <FormControlLabel value="public" control={<Radio inputProps={{ "aria-describedby": publicDescId }} />} label={<><Typography variant="body2" fontWeight={600}>Public</Typography><Typography id={publicDescId} variant="caption" color="text.secondary">Anyone in the organization can access this prompt.</Typography></>} />
            </RadioGroup>

            {shareDraftVisibility === "shared" && (
              <>
                <Autocomplete
                  options={shareResults}
                  filterOptions={(options) => options}
                  loading={shareSearchLoading}
                  inputValue={shareQuery}
                  onInputChange={(_, value, reason) => { if (reason === "input" || reason === "clear") setShareQuery(value); if (reason === "input" || reason === "clear") setShareLiveMessage(value.trim().length >= 2 ? `${shareResults.length} results` : ""); }}
                  getOptionLabel={(option) => `${option.name} (${option.email})`}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  noOptionsText={shareQuery.trim().length >= 2 ? `No people found matching '${shareQuery.trim()}'.` : "Type at least 2 characters"}
                  onChange={(_, selected) => {
                    if (!selected || shareDraftUsers.includes(selected.id)) return;
                    setShareDraftUsers((prev) => [...prev, selected.id]);
                    setShareSaveError(null);
                    setShareQuery("");
                  }}
                  renderOption={(props, option) => {
                    const alreadyAdded = shareDraftUsers.includes(option.id);
                    return (
                      <Box component="li" {...props} aria-disabled={alreadyAdded} sx={{ opacity: alreadyAdded ? 0.6 : 1 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2">{option.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{option.email}</Typography>
                        </Box>
                        <Typography variant="caption" color={alreadyAdded ? "text.disabled" : "text.secondary"}>{alreadyAdded ? "Added" : ""}</Typography>
                      </Box>
                    );
                  }}
                  renderInput={(params) => (<TextField {...params} label="Search people by name or email" inputRef={shareSearchInputRef} inputProps={{ ...params.inputProps, "aria-label": "Search people by name or email" }} InputProps={{ ...params.InputProps, endAdornment: <>{shareSearchLoading ? <CircularProgress color="inherit" size={16} /> : null}{params.InputProps.endAdornment}</> }} />)}
                />
                <Typography variant="body2">Shared with {shareDraftUsers.length === 1 ? "1 person" : `${shareDraftUsers.length} people`}.</Typography>
                {shareDraftUsers.length === 0 && <Typography variant="caption" color="text.secondary">No one added yet. Search above to share with someone.</Typography>}
                <Box component="ul" sx={{ m: 0, p: 0, listStyle: "none", border: 1, borderColor: "divider", borderRadius: 1, maxHeight: "min(250px, 35vh)", overflowY: "auto" }}>
                  {shareDraftUsers.filter((userId) => userId !== prompt.creatorId).map((userId) => {
                    const user = findDirectoryUserById(userId);
                    if (!user) return null;
                    return (<Box component="li" key={userId} sx={{ px: 1.5, py: 1, borderBottom: "1px solid", borderColor: "divider", "&:last-child": { borderBottom: "none" } }}><Stack direction="row" alignItems="center" justifyContent="space-between"><Typography variant="body2">{user.name} ({user.email})</Typography><IconButton size="small" aria-label={`Remove ${user.name} from sharing`} onClick={() => { setShareDraftUsers((prev) => prev.filter((id) => id !== userId)); setShareSaveError(null); }}><CloseIcon fontSize="small" /></IconButton></Stack></Box>);
                  })}
                </Box>
              </>
            )}
            {shareSaveError && <Alert severity="error">{shareSaveError}</Alert>}
            <Box role="status" aria-live="polite" sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{shareLiveMessage}</Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          {shareFooterMode === "default" && <><Button variant="outlined" onClick={requestShareModalClose}>Cancel</Button><Button variant="contained" onClick={() => { if (showDowngradeWarning) { setShareFooterMode("downgrade-warning"); setShareLiveMessage("Warning: Reducing access for existing users. Choose Cancel or Confirm."); return; } commitShareChanges(); }}>Done</Button></>}
          {shareFooterMode === "discard-warning" && <><Typography color="error" tabIndex={-1} ref={shareFooterAlertRef}>Unsaved changes</Typography><Button variant="outlined" onClick={() => setShareFooterMode("default")}>Keep Editing</Button><Button color="error" variant="contained" onClick={closeShareModal}>Discard</Button></>}
          {shareFooterMode === "downgrade-warning" && <><Typography color="warning.main" tabIndex={-1} ref={shareFooterAlertRef}>{downgradeWarningText}</Typography><Button variant="outlined" onClick={() => setShareFooterMode("default")}>Cancel</Button><Button color="warning" variant="contained" onClick={commitShareChanges}>Confirm</Button></>}
        </DialogActions>
      </Dialog>

      <Dialog open={publishDialogOpen} onClose={() => setPublishDialogOpen(false)} aria-labelledby="publish-dialog-title">
        <DialogTitle id="publish-dialog-title">Publish new version?</DialogTitle>
        <DialogContent>
          <DialogContentText>This will create a new immutable version.</DialogContentText>
          <DialogContentText>Published versions cannot be edited or deleted.</DialogContentText>
          {(promptVisibility === "shared" || promptVisibility === "public") && (
            <DialogContentText>
              {promptVisibility === "shared"
                ? `Because this prompt is Shared, this new version will immediately be available to ${sharedUsers.length} people.`
                : "Because this prompt is Public, this new version will immediately be available to everyone in your organization."}
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPublishDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="primary" disabled={isSharedWithNoUsers} onClick={handlePublishConfirm}>Publish</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} aria-labelledby="delete-dialog-title">
        <DialogTitle id="delete-dialog-title">{hasDraft ? "Delete draft?" : "Delete prompt?"}</DialogTitle>
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
