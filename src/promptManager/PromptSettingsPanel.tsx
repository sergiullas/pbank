import CloseIcon from "@mui/icons-material/Close";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  TextField,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { findDirectoryUserById, searchDirectoryUsers } from "../data/mockDirectory";
import { useStore } from "../state/store";
import type { Prompt, PromptVisibility } from "../types";

interface PromptSettingsPanelProps {
  prompt: Prompt;
  onClose: () => void;
}

export function PromptSettingsPanel({ prompt, onClose }: PromptSettingsPanelProps) {
  const updatePromptVisibility = useStore((state) => state.updatePromptVisibility);
  const updatePromptSharedUsers = useStore((state) => state.updatePromptSharedUsers);
  const setPromptManagerNotice = useStore((state) => state.setPromptManagerNotice);

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareQuery, setShareQuery] = useState("");
  const [shareResults, setShareResults] = useState<{ id: string; name: string; email: string }[]>([]);
  const [shareSearchLoading, setShareSearchLoading] = useState(false);

  const manageButtonRef = useRef<HTMLButtonElement | null>(null);
  const visibilityControlRef = useRef<HTMLDivElement | null>(null);

  const promptVisibility = prompt.visibility ?? "private";
  const sharedUsers = prompt.sharedWith?.users ?? [];
  const isSharedWithNoUsers = promptVisibility === "shared" && sharedUsers.length === 0;

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
        .then((results) => setShareResults(results))
        .finally(() => setShareSearchLoading(false));
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [shareModalOpen, shareQuery]);

  const closeShareModal = () => {
    setShareModalOpen(false);
    setShareQuery("");
    setShareResults([]);
    window.setTimeout(() => {
      if (manageButtonRef.current) {
        manageButtonRef.current.focus();
        return;
      }
      visibilityControlRef.current?.focus();
    }, 0);
  };

  const handleVisibilityChange = (nextVisibility: PromptVisibility) => {
    updatePromptVisibility(prompt.id, { visibility: nextVisibility });
    setPromptManagerNotice("Visibility updated");
  };

  const handleAddUser = (userId: string) => {
    updatePromptSharedUsers(prompt.id, [...sharedUsers, userId]);
    setPromptManagerNotice("Sharing updated");
  };

  const handleRemoveUser = (userId: string) => {
    updatePromptSharedUsers(prompt.id, sharedUsers.filter((id) => id !== userId));
    setPromptManagerNotice("Sharing updated");
  };

  return (
    <>
      <Box
        width={{ xs: "100%", lg: "38%" }}
        minWidth={{ xs: "100%", lg: 360 }}
        maxWidth={{ xs: "100%", lg: 560 }}
        borderLeft={{ xs: 0, lg: 1 }}
        borderTop={{ xs: 1, lg: 0 }}
        borderColor="divider"
        bgcolor="background.paper"
        display="flex"
        flexDirection="column"
        height="100%"
        minHeight={0}
        overflow="hidden"
      >
        <Box px={2} py={1.5} borderBottom={1} borderColor="divider" display="flex" alignItems="center" gap={1}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ flex: 1 }}>
            Settings
          </Typography>
          <IconButton size="small" onClick={onClose} aria-label="Close prompt settings panel">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box p={2} flex={1} minHeight={0} display="flex" flexDirection="column" gap={2} sx={{ overflowY: "auto" }}>
          <Stack spacing={1}>
            <Typography variant="body2" fontWeight={600}>Visibility</Typography>
            <ToggleButtonGroup
              ref={visibilityControlRef}
              exclusive
              size="small"
              value={promptVisibility}
              onChange={(_, next: PromptVisibility | null) => {
                if (!next) return;
                handleVisibilityChange(next);
              }}
              aria-label="Visibility"
            >
              <ToggleButton value="private" aria-label="Private">Private</ToggleButton>
              <ToggleButton value="shared" aria-label="Shared">Shared</ToggleButton>
              <ToggleButton value="organization" aria-label="Organization">Organization</ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          {promptVisibility === "shared" && (
            <Stack spacing={1}>
              <Typography variant="body2" fontWeight={600}>Shared with</Typography>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">{sharedUsers.length} people</Typography>
                <Button size="small" ref={manageButtonRef} onClick={() => setShareModalOpen(true)}>Manage</Button>
              </Stack>
              {isSharedWithNoUsers && (
                <Alert severity="warning" variant="outlined">
                  Add at least one person or change visibility to Private.
                </Alert>
              )}
            </Stack>
          )}
        </Box>
      </Box>

      <Dialog
        open={shareModalOpen}
        onClose={closeShareModal}
        fullWidth
        maxWidth="sm"
        aria-labelledby="share-prompt-title"
      >
        <DialogTitle id="share-prompt-title">Share Prompt</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <TextField
              autoFocus
              label="Search people or email"
              value={shareQuery}
              onChange={(event) => setShareQuery(event.target.value)}
              inputProps={{ "aria-label": "Search people or email" }}
            />

            <Typography variant="caption" color="text.secondary">Results</Typography>
            {shareSearchLoading ? <CircularProgress size={20} /> : (
              <List dense sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}>
                {shareResults.map((result) => {
                  const alreadyAdded = sharedUsers.includes(result.id);
                  return (
                    <ListItem
                      key={result.id}
                      secondaryAction={(
                        <Button size="small" disabled={alreadyAdded} onClick={() => handleAddUser(result.id)}>
                          {alreadyAdded ? "Added" : "Add"}
                        </Button>
                      )}
                    >
                      <ListItemText primary={result.name} secondary={result.email} />
                    </ListItem>
                  );
                })}
              </List>
            )}

            <Typography variant="caption" color="text.secondary">Shared with ({sharedUsers.length})</Typography>
            <List dense sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}>
              {sharedUsers.map((userId) => {
                const user = findDirectoryUserById(userId);
                if (!user) return null;
                return (
                  <ListItem
                    key={userId}
                    secondaryAction={(
                      <Button size="small" color="error" onClick={() => handleRemoveUser(userId)}>
                        Remove
                      </Button>
                    )}
                  >
                    <ListItemText primary={user.name} secondary={user.email} />
                  </ListItem>
                );
              })}
            </List>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeShareModal}>Done</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
