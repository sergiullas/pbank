import StarBorderIcon from "@mui/icons-material/StarBorder";
import StarIcon from "@mui/icons-material/Star";
import { Chip, IconButton, ListItemButton, ListItemText, Stack, Typography } from "@mui/material";
import type { Prompt } from "../types";

type PromptListItemProps = {
  prompt: Prompt;
  selected: boolean;
  isFavorite: boolean;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
};

export function PromptListItem({
  prompt,
  selected,
  isFavorite,
  onSelect,
  onToggleFavorite,
}: PromptListItemProps) {
  return (
    <ListItemButton selected={selected} onClick={() => onSelect(prompt.id)} alignItems="flex-start">
      <ListItemText
        primary={<Typography fontWeight={600}>{prompt.title}</Typography>}
        secondaryTypographyProps={{ component: "div" }}
        secondary={
          <Stack spacing={0.75} mt={0.5}>
            <Typography variant="caption" color="text.secondary">
              {prompt.category ?? "General"}
            </Typography>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {prompt.tags.slice(0, 2).map((tag) => (
                <Chip size="small" key={tag} label={tag} />
              ))}
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
