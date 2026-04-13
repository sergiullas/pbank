import { Box, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useMemo } from "react";
import { useStore } from "../state/store";
import {
  filterManagerPrompts,
  sortManagerPrompts,
  STATUS_FILTER_LABELS,
  STATUS_FILTER_OPTIONS,
} from "./promptManagerSelectors";
import { PromptManagerListItem } from "./PromptManagerListItem";

export function PromptManagerList() {
  const prompts = useStore((state) => state.prompts);
  const search = useStore((state) => state.promptManagerSearch);
  const statusFilter = useStore((state) => state.promptManagerStatusFilter);
  const setSearch = useStore((state) => state.setPromptManagerSearch);
  const setStatusFilter = useStore((state) => state.setPromptManagerStatusFilter);
  const selectManagedPrompt = useStore((state) => state.selectManagedPrompt);
  const startNewPromptDraft = useStore((state) => state.startNewPromptDraft);

  const visiblePrompts = useMemo(() => {
    const filtered = filterManagerPrompts(prompts, search, statusFilter);
    return sortManagerPrompts(filtered);
  }, [prompts, search, statusFilter]);

  return (
    <Box display="flex" flexDirection="column" height="100%" minHeight={0}>
      {/* Header */}
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
          Prompt Manager
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={startNewPromptDraft}
        >
          New Prompt
        </Button>
      </Box>

      {/* Controls */}
      <Box px={3} py={1.5} borderBottom={1} borderColor="divider" flexShrink={0}>
        <Stack direction="row" gap={1.5} alignItems="center">
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
            {visiblePrompts.length} {visiblePrompts.length === 1 ? "prompt" : "prompts"}
          </Typography>
        </Stack>
      </Box>

      {/* List */}
      <Box flex={1} minHeight={0} overflow="auto">
        {visiblePrompts.length === 0 ? (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            height="100%"
            gap={2}
            p={4}
          >
            {search || statusFilter !== "all" ? (
              <>
                <Typography variant="h6" color="text.secondary">
                  No prompts match your filters
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try adjusting your search or status filter.
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="h6" color="text.secondary">
                  No prompts yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create your first prompt to get started.
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={startNewPromptDraft}>
                  New Prompt
                </Button>
              </>
            )}
          </Box>
        ) : (
          visiblePrompts.map((prompt) => (
            <PromptManagerListItem
              key={prompt.id}
              prompt={prompt}
              onEdit={() => selectManagedPrompt(prompt.id)}
            />
          ))
        )}
      </Box>
    </Box>
  );
}
