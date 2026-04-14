import MoreVertIcon from "@mui/icons-material/MoreVert";
import {
  Box,
  Button,
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
  const unpublishPrompt = useStore((state) => state.unpublishPrompt);
  const archivePrompt = useStore((state) => state.archivePrompt);
  const restorePrompt = useStore((state) => state.restorePrompt);

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
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

  return (
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
          <Typography
            variant="body2"
            color="text.secondary"
            noWrap
            mb={0.25}
          >
            {prompt.description}
          </Typography>
        )}

        <Typography variant="caption" color="text.disabled">
          {getMetaLine(prompt)}
        </Typography>
      </Box>

      {/* Actions */}
      <Stack direction="row" gap={0.5} alignItems="center" flexShrink={0} onClick={(e) => e.stopPropagation()}>
        <Button size="small" variant="outlined" onClick={onEdit}>
          Edit
        </Button>

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
          {prompt.status === "published" && [
            <MenuItem key="unpublish" onClick={() => handleMenuAction(() => unpublishPrompt(prompt.id))}>
              Unpublish
            </MenuItem>,
            <MenuItem key="archive" onClick={() => handleMenuAction(() => archivePrompt(prompt.id))}>
              Archive
            </MenuItem>,
          ]}

          {prompt.status === "draft" && [
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
            <MenuItem key="archive" onClick={() => handleMenuAction(() => archivePrompt(prompt.id))}>
              Archive
            </MenuItem>,
          ]}

          {prompt.status === "archived" && (
            <MenuItem onClick={() => handleMenuAction(() => restorePrompt(prompt.id))}>
              Restore
            </MenuItem>
          )}
        </Menu>
      </Stack>
    </Box>
  );
}
