import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import type { Prompt } from "../types";
import { PromptStatusChip } from "./PromptStatusChip";
import { formatLastUpdated, getVersionSummary } from "./promptManagerSelectors";
import { useStore } from "../state/store";

interface PromptManagerListItemProps {
  prompt: Prompt;
  onEdit: () => void;
}

export function PromptManagerListItem({ prompt, onEdit }: PromptManagerListItemProps) {
  const publishPrompt = useStore((state) => state.publishPrompt);
  const unpublishPrompt = useStore((state) => state.unpublishPrompt);
  const archivePrompt = useStore((state) => state.archivePrompt);
  const restorePrompt = useStore((state) => state.restorePrompt);

  return (
    <Box
      sx={(theme) => ({
        px: 3,
        py: 2,
        borderBottom: `1px solid ${theme.palette.divider}`,
        display: "flex",
        alignItems: "flex-start",
        gap: 2,
        "&:hover": { bgcolor: "action.hover" },
        transition: "background-color 120ms ease",
      })}
    >
      {/* Main content */}
      <Box flex={1} minWidth={0}>
        <Stack direction="row" alignItems="center" gap={1} mb={0.5} flexWrap="wrap">
          <Typography
            variant="subtitle2"
            fontWeight={600}
            noWrap
            sx={{ cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
            onClick={onEdit}
          >
            {prompt.title}
          </Typography>
          <PromptStatusChip status={prompt.status} hasUnpublishedChanges={prompt.hasUnpublishedChanges} />
        </Stack>

        {prompt.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              mb: 0.75,
            }}
          >
            {prompt.description}
          </Typography>
        )}

        <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
          <Typography variant="caption" color="text.secondary">
            {getVersionSummary(prompt)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Updated {formatLastUpdated(prompt)}
          </Typography>
          {prompt.tags.slice(0, 2).map((tag) => (
            <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ height: 18, fontSize: "0.7rem" }} />
          ))}
        </Stack>
      </Box>

      {/* Quick actions */}
      <Stack direction="row" gap={0.5} alignItems="center" flexShrink={0}>
        <Button size="small" variant="outlined" onClick={onEdit} sx={{ minWidth: 0 }}>
          Edit
        </Button>

        {prompt.status === "draft" && (
          <Button
            size="small"
            variant="contained"
            color="success"
            onClick={() => publishPrompt(prompt.id, {
              title: prompt.title,
              description: prompt.description,
              desiredOutcome: prompt.desiredOutcome,
              tags: prompt.tags,
              content: prompt.content,
            })}
            sx={{ minWidth: 0 }}
          >
            Publish
          </Button>
        )}

        {prompt.status === "published" && (
          <Button
            size="small"
            variant="outlined"
            color="warning"
            onClick={() => unpublishPrompt(prompt.id)}
            sx={{ minWidth: 0 }}
          >
            Unpublish
          </Button>
        )}

        {prompt.status === "draft" && (
          <Button
            size="small"
            variant="text"
            color="inherit"
            onClick={() => archivePrompt(prompt.id)}
            sx={{ minWidth: 0, color: "text.secondary" }}
          >
            Archive
          </Button>
        )}

        {prompt.status === "archived" && (
          <Button
            size="small"
            variant="outlined"
            onClick={() => restorePrompt(prompt.id)}
            sx={{ minWidth: 0 }}
          >
            Restore
          </Button>
        )}
      </Stack>
    </Box>
  );
}
