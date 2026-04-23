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
  const discardPromptDraft = useStore((state) => state.discardPromptDraft);
  const deletePrompt = useStore((state) => state.deletePrompt);
  const setPromptManagerNotice = useStore((state) => state.setPromptManagerNotice);

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
    const hasVersionHistory = (prompt.versions?.length ?? 0) > 0 || Boolean(prompt.publishedVersionId);
    if (hasVersionHistory) {
      discardPromptDraft(prompt.id);
      setPromptManagerNotice("Draft deleted.");
    } else {
      deletePrompt(prompt.id);
      setPromptManagerNotice("Prompt deleted.");
    }
    setDeleteDialogOpen(false);
  };

  const rowLabel = `Open prompt ${prompt.title}`;
  const menuButtonLabel = `More actions for ${prompt.title}`;

  return (
    <>
      <Box
        role="button"
        tabIndex={0}
        aria-label={rowLabel}
        onClick={onEdit}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onEdit();
          }
        }}
        sx={(theme) => ({
          px: 2.5,
          py: 1.75,
          borderTop: showTopBorder ? `1px solid ${theme.palette.divider}` : "none",
          display: "flex",
          alignItems: "center",
          gap: 2,
          cursor: "pointer",
          outline: "none",
          transition: "background-color 120ms ease",
          "&:hover": { bgcolor: "action.hover" },
          "&:focus-visible": {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: -2,
          },
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

          <Typography variant="caption" color="text.secondary">
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
          <Tooltip title={menuButtonLabel}>
            <IconButton
              size="small"
              aria-label={menuButtonLabel}
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
            MenuListProps={{ "aria-label": `Prompt actions for ${prompt.title}` }}
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
              <MenuItem
                onClick={() =>
                  handleMenuAction(() => {
                    archivePrompt(prompt.id);
                    setPromptManagerNotice("Prompt archived.");
                  })
                }
              >
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
                  handleMenuAction(() => {
                    publishPrompt(prompt.id, {
                      title: prompt.title,
                      description: prompt.description,
                      desiredOutcome: prompt.desiredOutcome,
                      tags: prompt.tags,
                      content: prompt.content,
                    });
                    setPromptManagerNotice("Prompt published.");
                  })
                }
              >
                Publish
              </MenuItem>,
              <MenuItem key="delete" onClick={handleDeleteClick} sx={{ color: "error.main" }}>
                {(prompt.versions?.length ?? 0) > 0 || prompt.publishedVersionId ? "Delete Draft" : "Delete Prompt"}
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
        <DialogTitle>{(prompt.versions?.length ?? 0) > 0 || prompt.publishedVersionId ? "Delete draft?" : "Delete prompt?"}</DialogTitle>
        <DialogContent>
          {(prompt.versions?.length ?? 0) > 0 || prompt.publishedVersionId ? (
            <DialogContentText>
              This will remove your current unpublished changes. Previous versions will remain available.
            </DialogContentText>
          ) : (
            <DialogContentText>
              This will permanently remove this prompt.
            </DialogContentText>
          )}
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
