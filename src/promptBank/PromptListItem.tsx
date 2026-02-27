import StarBorderIcon from "@mui/icons-material/StarBorder";
import StarIcon from "@mui/icons-material/Star";
import { Box, Button, Chip, IconButton, ListItem, ListItemButton, ListItemText, Stack, Typography } from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import type { Prompt } from "../types";

type PromptListItemProps = {
  prompt: Prompt;
  selected: boolean;
  isFavorite: boolean;
  isFavoritesView: boolean;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onInsert: (content: string, id: string) => void;
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
  isFavoritesView,
  onSelect,
  onToggleFavorite,
  onInsert,
}: PromptListItemProps) {
  if (isFavoritesView) {
    return (
      <ListItem
        disablePadding
        sx={{
          borderBottom: "1px solid",
          borderColor: "divider",
          ".insert-button-wrap": {
            opacity: 0,
            pointerEvents: "none",
            transition: "opacity 180ms ease",
          },
          "&:hover, &:focus-within": {
            bgcolor: "action.hover",
            ".insert-button-wrap": {
              opacity: 1,
              pointerEvents: "auto",
            },
          },
        }}
      >
        <Box width="100%" px={1.5} py={1.25} position="relative" pb={7.5}>
          <IconButton
            edge="end"
            sx={{ position: "absolute", top: 6, right: 8, zIndex: 1 }}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(prompt.id);
            }}
          >
            {isFavorite ? <StarIcon fontSize="small" color="warning" /> : <StarBorderIcon fontSize="small" />}
          </IconButton>

          <Box
            role="button"
            tabIndex={0}
            onClick={() => onSelect(prompt.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(prompt.id);
              }
            }}
            sx={{
              cursor: "pointer",
              borderRadius: 1,
              outline: "none",
              "&:focus-visible": {
                boxShadow: (theme) => `0 0 0 2px ${theme.palette.primary.main}`,
              },
            }}
          >
            <Typography fontWeight={600} pr={4}>{prompt.title}</Typography>
            <Stack spacing={1.5} mt={1}>
              <Typography variant="body2" color="text.secondary">
                {prompt.description}
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                {prompt.tags.slice(0, 2).map((tag) => (
                  <Chip size="small" key={tag} label={tag} />
                ))}
              </Stack>
            </Stack>
          </Box>

          <Box className="insert-button-wrap" position="absolute" left={12} right={12} bottom={12}>
            <Button
              variant="outlined"
              size="small"
              fullWidth
              aria-label={`Insert ${prompt.title} prompt`}
              onClick={(event) => {
                event.stopPropagation();
                onInsert(prompt.content, prompt.id);
              }}
            >
              Insert Prompt
            </Button>
          </Box>
        </Box>
      </ListItem>
    );
  }

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
