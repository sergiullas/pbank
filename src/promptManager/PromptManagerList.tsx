import AddIcon from "@mui/icons-material/Add";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo } from "react";
import { useStore } from "../state/store";
import type { Prompt } from "../types";
import {
  filterManagerPrompts,
  formatLastUpdated,
  LIST_SECTION_TITLE,
  sortManagerPrompts,
  STATUS_FILTER_LABELS,
  STATUS_FILTER_OPTIONS,
} from "./promptManagerSelectors";
import { PromptManagerListItem } from "./PromptManagerListItem";
import { PromptStatusChip } from "./PromptStatusChip";

const MAX_DRAFT_CARDS = 3;

// ── Draft card ───────────────────────────────────────────────────────────────

function DraftCard({ prompt, onEdit }: { prompt: Prompt; onEdit: () => void }) {
  const snippet = prompt.description || (prompt.content.trim() ? prompt.content : null);

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onEdit}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onEdit()}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        p: 2,
        cursor: "pointer",
        bgcolor: "background.paper",
        display: "flex",
        flexDirection: "column",
        gap: 0.75,
        outline: "none",
        transition: "border-color 150ms ease, background-color 150ms ease",
        "&:hover": { bgcolor: "action.hover", borderColor: "text.disabled" },
        "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: -2 },
      }}
    >
      <Stack direction="row" alignItems="flex-start" gap={1}>
        <Typography
          variant="subtitle2"
          fontWeight={600}
          sx={{ flex: 1, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
        >
          {prompt.title}
        </Typography>
        <PromptStatusChip status="draft" />
      </Stack>

      {snippet && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
        >
          {snippet}
        </Typography>
      )}

      <Typography variant="caption" color="text.secondary">
        Updated {formatLastUpdated(prompt)}
      </Typography>
    </Box>
  );
}

// ── Main list ────────────────────────────────────────────────────────────────

export function PromptManagerList() {
  const prompts = useStore((state) => state.prompts);
  const search = useStore((state) => state.promptManagerSearch);
  const statusFilter = useStore((state) => state.promptManagerStatusFilter);
  const setSearch = useStore((state) => state.setPromptManagerSearch);
  const setStatusFilter = useStore((state) => state.setPromptManagerStatusFilter);
  const selectManagedPrompt = useStore((state) => state.selectManagedPrompt);
  const startNewPromptDraft = useStore((state) => state.startNewPromptDraft);

  // All draft prompts, sorted — used for card strip count and overflow detection
  const allDraftPrompts = useMemo(
    () => sortManagerPrompts(prompts.filter((p) => p.status === "draft")),
    [prompts],
  );
  const draftCardPrompts = allDraftPrompts.slice(0, MAX_DRAFT_CARDS);
  const hasDrafts = allDraftPrompts.length > 0;

  // Lower list — uses the active filter (All is genuinely all statuses)
  const listedPrompts = useMemo(
    () => sortManagerPrompts(filterManagerPrompts(prompts, search, statusFilter)),
    [prompts, search, statusFilter],
  );

  const hasActiveFilter = search.trim().length > 0 || statusFilter !== "published";

  const handleViewAllDrafts = () => {
    setSearch("");
    setStatusFilter("draft");
  };

  return (
    <Box display="flex" flexDirection="column" height="100%" minHeight={0}>
      {/* ── Page header ── */}
      <Box
        px={3}
        py={2}
        borderBottom={1}
        borderColor="divider"
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        flexShrink={0}
      >
        <Typography variant="h5" fontWeight={700}>
          Prompt Builder
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={startNewPromptDraft}>
          New Prompt
        </Button>
      </Box>

      {/* ── Scrollable body ── */}
      <Box flex={1} minHeight={0} overflow="auto">
        <Box maxWidth={960} mx="auto" px={3} py={3}>

          {/* ── Drafts section ── */}
          <Box mb={4}>
            <Stack direction="row" alignItems="baseline" justifyContent="space-between" mb={1.5}>
              <Typography variant="overline" color="text.secondary" letterSpacing={1}>
                Recent Drafts
              </Typography>
              {hasDrafts && (
                <Link
                  component="button"
                  variant="caption"
                  underline="hover"
                  onClick={handleViewAllDrafts}
                  sx={{ color: "primary.main", cursor: "pointer" }}
                >
                  View all drafts
                </Link>
              )}
            </Stack>

            {draftCardPrompts.length === 0 ? (
              <Box
                sx={{
                  border: "1px dashed",
                  borderColor: "divider",
                  borderRadius: 2,
                  p: 3,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  No drafts yet
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={startNewPromptDraft}
                >
                  Create new prompt
                </Button>
              </Box>
            ) : (
              <Box
                display="grid"
                gridTemplateColumns={{ xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }}
                gap={1.5}
              >
                {draftCardPrompts.map((prompt) => (
                  <DraftCard
                    key={prompt.id}
                    prompt={prompt}
                    onEdit={() => selectManagedPrompt(prompt.id)}
                  />
                ))}
              </Box>
            )}
          </Box>

          {/* ── Lower list section ── */}
          <Box>
            <Typography variant="overline" color="text.secondary" letterSpacing={1} display="block" mb={1.5}>
              {LIST_SECTION_TITLE[statusFilter]}
            </Typography>

            {/* Controls */}
            <Stack direction="row" gap={1.5} alignItems="center" mb={1.5}>
              <TextField
                size="small"
                placeholder="Search prompts…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ flex: 1, maxWidth: 360 }}
              />
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel id="pm-status-filter-label">Status</InputLabel>
                <Select
                  labelId="pm-status-filter-label"
                  label="Status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                >
                  {STATUS_FILTER_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {STATUS_FILTER_LABELS[option]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                {listedPrompts.length} {listedPrompts.length === 1 ? "prompt" : "prompts"}
              </Typography>
            </Stack>

            {/* List */}
            {listedPrompts.length === 0 ? (
              <Box
                sx={{
                  border: "1px dashed",
                  borderColor: "divider",
                  borderRadius: 2,
                  p: 4,
                  textAlign: "center",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {hasActiveFilter
                    ? "No prompts match your filters. Try adjusting your search or status."
                    : "No published prompts yet. Publish a draft to make it appear here."}
                </Typography>
              </Box>
            ) : (
              <Box border={1} borderColor="divider" borderRadius={2} overflow="hidden">
                {listedPrompts.map((prompt, index) => (
                  <PromptManagerListItem
                    key={prompt.id}
                    prompt={prompt}
                    onEdit={() => selectManagedPrompt(prompt.id)}
                    showTopBorder={index > 0}
                  />
                ))}
              </Box>
            )}
          </Box>

        </Box>
      </Box>
    </Box>
  );
}
