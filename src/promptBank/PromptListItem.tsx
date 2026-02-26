import StarBorderIcon from "@mui/icons-material/StarBorder";
import StarIcon from "@mui/icons-material/Star";
import { Chip, IconButton, ListItemButton, ListItemText, Stack, Typography } from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import type { Prompt } from "../types";

type PromptListItemProps = {
  prompt: Prompt;
  selected: boolean;
  isFavorite: boolean;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
};

const formatCreatedLabel = (createdAt: string): string => {
  const parsed = Date.parse(createdAt);
  if (Number.isNaN(parsed)) return "Unknown";

  const days = Math.max(0, Math.floor((Date.now() - parsed) / 86_400_000));
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
};

export function PromptListItem({
  prompt,
  selected,
  isFavorite,
  onSelect,
  onToggleFavorite,
}: PromptListItemProps) {
  return (
    <ListItemButton
      selected={selected}
      onClick={() => onSelect(prompt.id)}
      alignItems="flex-start"
      sx={{
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <ListItemText
        primary={<Typography fontWeight={600}>{prompt.title}</Typography>}
        secondaryTypographyProps={{ component: "div" }}
        secondary={
          <Stack spacing={1.5} mt={1}>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {prompt.description}
            </Typography>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap mt={1.5}>
              {prompt.tags.slice(0, 2).map((tag) => (
                <Chip size="small" key={tag} label={tag} />
              ))}
            </Stack>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" alignItems="center" useFlexGap mt={1}>
              <ThumbUpIcon sx={{ fontSize: "1rem" }} />
              <Typography variant="caption" color="text.secondary" mt={0.5}>
                {prompt.likes} |
              </Typography>
              <AccessTimeIcon sx={{ fontSize: "1rem" }} />
              <Typography variant="caption" color="text.secondary" mt={0.5}>
                {formatCreatedLabel(prompt.createdAt)}
              </Typography>
            </Stack>
          </Stack>
        }
      />
      <IconButton
        edge="end"
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(prompt.id);
        }}
      >
        {isFavorite ? <StarIcon fontSize="small" color="warning" /> : <StarBorderIcon fontSize="small" />}
      </IconButton>
    </ListItemButton>
  );
}
