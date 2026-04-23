import MoreVertIcon from "@mui/icons-material/MoreVert";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";
import type { Prompt } from "../types";
import { useStore } from "../state/store";
import { getMetaLine } from "./promptManagerSelectors";
import { PromptStatusChip } from "./PromptStatusChip";

interface PromptManagerListItemProps {
  prompt: Prompt;
  onEdit: () => void;
  showTopBorder?: boolean;
}

export function PromptManagerListItem({ prompt, onEdit, showTopBorder = false }: PromptManagerListItemProps) {
  const publishPrompt = useStore((state) => state.publishPrompt);
  const archivePrompt = useStore((state) => state.archivePrompt);
  const restorePrompt = useStore((state) => state.restorePrompt);
  const savePromptAsNewVersion = useStore((state) => state.savePromptAsNewVersion);
  const deletePrompt = useStore((state) => state.deletePrompt);

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const menuOpen = Boolean(menuAnchor);

  const handleOpenMenu = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
  };

  const handleCloseMenu = () => setMenuAnchor(null);

  const handleMenuAction = (action: () => void) => {
    action();
    handleCloseMenu();
  };

  const handleDeleteClick = () => {
    handleCloseMenu();
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    deletePrompt(prompt.id);
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <Box
        onClick={onEdit}
        sx={(theme) => ({
          px: 2.5,
          py: 1.75,
          borderTop: showTopBorder ? `1px solid ${theme.palette.divider}` : "none",
          display: "flex",
          alignItems: "center",
          gap: 2,
          cursor: "pointer",
          transition: "background-color 120ms ease",
          "&:hover": { bgcolor: "action.hover" },
        })}
      >
        {/* Main content */}
        <Box flex={1} minWidth={0}>
          <Stack direction="row" alignItems="center" gap={1} mb={0.25} flexWrap="wrap">
            <Typography variant="subtitle2" fontWeight={600} noWrap>
              {prompt.title}
            </Typography>
            <PromptStatusChip status={prompt.status} hasUnpublishedChanges={prompt.hasUnpublishedChanges} />
          </Stack>

          {prompt.description && (
            <Typography variant="body2" color="text.secondary" noWrap mb={0.25}>
              {prompt.description}
            </Typography>
          )}

          <Typography variant="caption" color="text.disabled">
            {getMetaLine(prompt)}
          </Typography>
        </Box>

        {/* Actions — stopPropagation so row click doesn't fire when interacting with buttons */}
        <Stack
          direction="row"
          gap={0.5}
          alignItems="center"
          flexShrink={0}
          onClick={(e) => e.stopPropagation()}
        >
          <Tooltip title="More actions">
            <IconButton
              size="small"
              aria-label="More actions"
              aria-haspopup="menu"
              aria-expanded={menuOpen ? "true" : undefined}
              onClick={handleOpenMenu}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={menuAnchor}
            open={menuOpen}
            onClose={handleCloseMenu}
            onClick={(e) => e.stopPropagation()}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            MenuListProps={{ "aria-label": "Prompt actions" }}
          >
            {prompt.status === "published" && (
              <MenuItem onClick={() => handleMenuAction(onEdit)}>
                View
              </MenuItem>
            )}
            {prompt.status === "published" && (
              <MenuItem
                onClick={() =>
                  handleMenuAction(() => {
                    savePromptAsNewVersion(prompt.id, {
                      description: prompt.description,
                      desiredOutcome: prompt.desiredOutcome,
                      content: prompt.content,
                    });
                    onEdit();
                  })
                }
              >
                Create New Version
              </MenuItem>
            )}
            {prompt.status === "published" && (
              <MenuItem onClick={() => handleMenuAction(() => archivePrompt(prompt.id))}>
                Archive
              </MenuItem>
            )}

            {prompt.status === "draft" && [
              <MenuItem key="edit" onClick={() => handleMenuAction(onEdit)}>
                View
              </MenuItem>,
              <MenuItem
                key="publish"
                onClick={() =>
                  handleMenuAction(() =>
                    publishPrompt(prompt.id, {
                      title: prompt.title,
                      description: prompt.description,
                      desiredOutcome: prompt.desiredOutcome,
                      tags: prompt.tags,
                      content: prompt.content,
                    }),
                  )
                }
              >
                Publish
              </MenuItem>,
              <MenuItem key="delete" onClick={handleDeleteClick} sx={{ color: "error.main" }}>
                Delete Draft
              </MenuItem>,
            ]}

            {prompt.status === "archived" && (
              <MenuItem onClick={() => handleMenuAction(onEdit)}>
                View
              </MenuItem>
            )}
            {prompt.status === "archived" && (
              <MenuItem onClick={() => handleMenuAction(() => restorePrompt(prompt.id))}>
                Restore
              </MenuItem>
            )}
          </Menu>
        </Stack>
      </Box>

      {/* Delete confirmation dialog — rendered via portal, outside row click scope */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onClick={(e) => e.stopPropagation()}
      >
        <DialogTitle>Delete draft?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This draft will be permanently removed.
          </DialogContentText>
          <DialogContentText sx={{ mt: 0.5 }}>
            Versions inside this draft will also be removed.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
