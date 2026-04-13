import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useEffect, useMemo, useState } from "react";
import type { Prompt } from "../types";
import { useStore } from "../state/store";
import { extractTemplateVariables } from "../promptBank/templateVariables";
import { getLatestVersion, getPublishedVersion } from "../promptBank/versioning";
import { PromptStatusChip } from "./PromptStatusChip";
import { formatLastUpdated } from "./promptManagerSelectors";

interface PromptEditorProps {
  prompt: Prompt;
  onBack: () => void;
}

export function PromptEditor({ prompt, onBack }: PromptEditorProps) {
  const savePromptDraft = useStore((state) => state.savePromptDraft);
  const publishPrompt = useStore((state) => state.publishPrompt);
  const unpublishPrompt = useStore((state) => state.unpublishPrompt);
  const archivePrompt = useStore((state) => state.archivePrompt);
  const savePromptAsNewVersion = useStore((state) => state.savePromptAsNewVersion);

  // Local form state — mirrors the working editor content
  const [title, setTitle] = useState(prompt.title);
  const [description, setDescription] = useState(prompt.description ?? "");
  const [desiredOutcome, setDesiredOutcome] = useState(prompt.desiredOutcome ?? "");
  const [content, setContent] = useState(prompt.content);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  // Re-sync if the prompt object changes (e.g., after a store action)
  useEffect(() => {
    setTitle(prompt.title);
    setDescription(prompt.description ?? "");
    setDesiredOutcome(prompt.desiredOutcome ?? "");
    setContent(prompt.content);
  }, [prompt.id]); // Only reset on prompt ID change, not every update

  const templateVariables = useMemo(() => extractTemplateVariables(content), [content]);

  const latestVersion = getLatestVersion(prompt);
  const publishedVersion = prompt.publishedVersionId ? getPublishedVersion(prompt) : null;
  const versionCount = prompt.versions?.length ?? 0;

  const isDirty =
    title !== prompt.title ||
    description !== (prompt.description ?? "") ||
    desiredOutcome !== (prompt.desiredOutcome ?? "") ||
    content !== prompt.content;

  const showFeedback = (msg: string) => {
    setSavedFeedback(msg);
    setTimeout(() => setSavedFeedback(null), 3000);
  };

  const buildPayload = () => ({
    title: title.trim() || "Untitled Prompt",
    description: description.trim() || undefined,
    desiredOutcome: desiredOutcome.trim() || undefined,
    tags: prompt.tags,
    content,
  });

  const handleSaveDraft = () => {
    savePromptDraft(prompt.id, buildPayload());
    showFeedback("Draft saved.");
  };

  const handlePublish = () => {
    publishPrompt(prompt.id, buildPayload());
    showFeedback(prompt.status === "published" ? "Changes published." : "Prompt published.");
  };

  const handleUnpublish = () => {
    unpublishPrompt(prompt.id);
    showFeedback("Prompt unpublished and moved to Draft.");
  };

  const handleSaveAsNewVersion = () => {
    savePromptAsNewVersion(prompt.id, {
      description: description.trim() || undefined,
      desiredOutcome: desiredOutcome.trim() || undefined,
      content,
    });
    showFeedback("Saved as new version.");
  };

  const handleArchive = () => {
    archivePrompt(prompt.id);
    onBack();
  };

  // Status label shown in header
  const statusLabel = (() => {
    if (prompt.status === "published" && prompt.hasUnpublishedChanges) return "Published with unpublished changes";
    if (prompt.status === "published") return "Published";
    if (prompt.status === "archived") return "Archived";
    return "Draft";
  })();

  return (
    <Box display="flex" flexDirection="column" height="100%" minHeight={0}>
      {/* Editor header */}
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
          <IconButton size="small" onClick={onBack} aria-label="Back to Prompt Manager">
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>

        <Typography variant="subtitle1" fontWeight={600} noWrap sx={{ flex: 1, minWidth: 0 }}>
          {title || "Untitled Prompt"}
        </Typography>

        <PromptStatusChip status={prompt.status} hasUnpublishedChanges={prompt.hasUnpublishedChanges} />

        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
          {statusLabel}
        </Typography>
      </Box>

      {/* Scrollable body */}
      <Box flex={1} minHeight={0} overflow="auto">
        <Box maxWidth={800} mx="auto" px={3} py={3}>
          <Stack spacing={4}>

            {/* Saved feedback */}
            {savedFeedback && (
              <Alert severity="success" sx={{ py: 0.5 }}>
                {savedFeedback}
              </Alert>
            )}

            {/* — Metadata section — */}
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

              <TextField
                label="Desired Outcome"
                value={desiredOutcome}
                onChange={(e) => setDesiredOutcome(e.target.value)}
                fullWidth
                multiline
                minRows={2}
                maxRows={4}
                helperText="What should be true after this prompt is used?"
              />

              {prompt.tags.length > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.75}>
                    Tags
                  </Typography>
                  <Stack direction="row" gap={0.75} flexWrap="wrap">
                    {prompt.tags.map((tag) => (
                      <Chip key={tag} label={tag} size="small" />
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>

            <Divider />

            {/* — Template section — */}
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
                minRows={8}
                maxRows={24}
                placeholder="Write your prompt template here…"
                inputProps={{ "aria-label": "Prompt template content", style: { fontFamily: "monospace", fontSize: "0.875rem" } }}
              />

              <Typography variant="caption" color="text.secondary">
                Use <code>[TOKEN]</code> syntax to create dynamic variables.{" "}
                <code>[CONTEXT]</code> is treated as attached file context in chat.
              </Typography>
            </Stack>

            {/* — Variables preview section — */}
            {templateVariables.length > 0 && (
              <>
                <Divider />
                <Stack spacing={1.5}>
                  <Typography variant="overline" color="text.secondary" letterSpacing={1}>
                    Detected Variables
                  </Typography>
                  <Stack direction="row" gap={1} flexWrap="wrap">
                    {templateVariables.map((variable) => (
                      <Tooltip
                        key={variable.token}
                        title={variable.isContext ? "Uses attached file as context in chat" : `Variable: ${variable.raw}`}
                      >
                        <Chip
                          label={variable.raw}
                          size="small"
                          color={variable.isContext ? "info" : "default"}
                          variant={variable.isContext ? "filled" : "outlined"}
                          sx={variable.isContext ? {} : {
                            fontFamily: "monospace",
                            borderColor: "text.disabled",
                          }}
                        />
                      </Tooltip>
                    ))}
                  </Stack>
                  {templateVariables.some((v) => v.isContext) && (
                    <Box
                      p={1.5}
                      borderRadius={1.5}
                      sx={{ bgcolor: (theme) => alpha(theme.palette.info.main, 0.08) }}
                    >
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
                </Stack>
              </>
            )}

            {templateVariables.length === 0 && content.trim() && (
              <>
                <Divider />
                <Box>
                  <Typography variant="overline" color="text.secondary" letterSpacing={1} display="block" mb={1}>
                    Detected Variables
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    No variables detected. Add <code>[TOKEN]</code> placeholders to make this prompt dynamic.
                  </Typography>
                </Box>
              </>
            )}

            <Divider />

            {/* — Version section — */}
            <Stack spacing={1.5}>
              <Typography variant="overline" color="text.secondary" letterSpacing={1}>
                Versions
              </Typography>

              <Stack spacing={0.5}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Working version:</strong>{" "}
                  {versionCount === 0
                    ? "v1 (unsaved)"
                    : `v${latestVersion.version} (latest)`}
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

              <Button
                variant="outlined"
                size="small"
                onClick={handleSaveAsNewVersion}
                sx={{ alignSelf: "flex-start" }}
                disabled={!content.trim()}
              >
                Save as New Version
              </Button>
            </Stack>

          </Stack>
        </Box>
      </Box>

      {/* — Footer actions — */}
      <Box
        px={3}
        py={2}
        borderTop={1}
        borderColor="divider"
        bgcolor="background.default"
        display="flex"
        alignItems="center"
        gap={1.5}
        flexShrink={0}
        flexWrap="wrap"
      >
        {/* Primary actions */}
        {prompt.status !== "archived" && (
          <Button
            variant="outlined"
            onClick={handleSaveDraft}
            disabled={!isDirty && prompt.status !== "draft"}
          >
            Save Draft
          </Button>
        )}

        {(prompt.status === "draft" || prompt.status === "archived") && (
          <Button
            variant="contained"
            color="success"
            onClick={handlePublish}
            disabled={!content.trim()}
          >
            Publish
          </Button>
        )}

        {prompt.status === "published" && (
          <>
            <Button
              variant="contained"
              color="primary"
              onClick={handlePublish}
              disabled={!isDirty || !content.trim()}
            >
              Publish Changes
            </Button>
            <Button
              variant="outlined"
              color="warning"
              onClick={handleUnpublish}
            >
              Unpublish
            </Button>
          </>
        )}

        {/* Secondary / destructive */}
        <Box flex={1} />

        {prompt.status !== "archived" && (
          <Button
            variant="text"
            color="inherit"
            onClick={handleArchive}
            sx={{ color: "text.secondary" }}
          >
            Archive
          </Button>
        )}

        <Button variant="text" color="inherit" onClick={onBack} sx={{ color: "text.secondary" }}>
          Back to Manager
        </Button>
      </Box>
    </Box>
  );
}
