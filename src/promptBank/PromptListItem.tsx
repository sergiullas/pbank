import StarBorderIcon from "@mui/icons-material/StarBorder";
import StarIcon from "@mui/icons-material/Star";
import LockIcon from "@mui/icons-material/Lock";
import GroupIcon from "@mui/icons-material/Group";
import PublicIcon from "@mui/icons-material/Public";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { Box, Button, Chip, IconButton, ListItem, ListItemButton, ListItemText, Stack, Tooltip, Typography } from "@mui/material";
import type { Prompt, VisibilityLevel } from "../types";

type PromptListItemProps = {
  prompt: Prompt;
  selected: boolean;
  isFavorite: boolean;
  isFavoritesView: boolean;
  isArchived?: boolean;
  isOwnPrompt?: boolean;
  versionLabel?: string;
  insertContent?: string;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onInsert: (content: string, id: string) => void;
};

const truncateCountDisplay = (value: number): number => Math.floor(value / 10);

const formatCreatedLabel = (createdAt: string): string => {
  const parsed = Date.parse(createdAt);
  if (Number.isNaN(parsed)) return "Unknown";

  const days = Math.max(0, Math.floor((Date.now() - parsed) / 86_400_000));
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
};

const formatShortDate = (dateStr?: string | null): string | null => {
  if (!dateStr) return null;
  const parsed = Date.parse(dateStr);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const VISIBILITY_ICONS: Record<VisibilityLevel, { icon: React.ReactElement; label: string }> = {
  private: { icon: <LockIcon fontSize="inherit" />, label: "Private — only you can access" },
  shared: { icon: <GroupIcon fontSize="inherit" />, label: "Shared — selected people can access" },
  organization: { icon: <PublicIcon fontSize="inherit" />, label: "Organization — everyone can access" },
};

function VisibilityIcon({ visibility }: { visibility?: VisibilityLevel }) {
  if (!visibility) return null;
  const { icon, label } = VISIBILITY_ICONS[visibility];
  return (
    <Tooltip title={label} placement="top">
      <Box
        component="span"
        aria-label={label}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          fontSize: "0.875rem",
          color: "text.disabled",
          verticalAlign: "middle",
          ml: 0.5,
        }}
      >
        {icon}
      </Box>
    </Tooltip>
  );
}

function MetaLine({
  versionLabel,
  publishedAt,
  visibility,
  owner,
  isOwnPrompt,
}: {
  versionLabel?: string;
  publishedAt?: string | null;
  visibility?: VisibilityLevel;
  owner: string;
  isOwnPrompt?: boolean;
}) {
  const shortDate = formatShortDate(publishedAt);
  const ownerDisplay = isOwnPrompt ? "You" : owner;

  return (
    <Stack spacing={0.25}>
      <Stack direction="row" alignItems="center" spacing={0} flexWrap="wrap">
        <Typography variant="caption" color="text.secondary">
          {versionLabel ?? "Latest"}
          {shortDate ? ` • ${shortDate}` : ""}
        </Typography>
        <VisibilityIcon visibility={visibility} />
      </Stack>
      <Stack direction="row" alignItems="center" gap={0.75}>
        <Typography variant="caption" color="text.secondary">
          by {ownerDisplay}
        </Typography>
        {isOwnPrompt && (
          <Chip
            label="Mine"
            size="small"
            color="primary"
            variant="outlined"
            sx={{ height: 16, fontSize: "0.65rem", "& .MuiChip-label": { px: 0.75 } }}
          />
        )}
      </Stack>
    </Stack>
  );
}

export function PromptListItem({
  prompt,
  selected,
  isFavorite,
  isFavoritesView,
  isArchived = false,
  isOwnPrompt = false,
  versionLabel,
  insertContent,
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
            aria-label={`Favorite prompt ${prompt.title}`}
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
            <MetaLine
              versionLabel={versionLabel}
              publishedAt={prompt.publishedAt}
              visibility={prompt.visibility}
              owner={prompt.owner}
              isOwnPrompt={isOwnPrompt}
            />
            {isArchived && <Chip label="Archived" size="small" color="warning" variant="outlined" sx={{ mt: 0.75 }} />}
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
                onInsert(insertContent ?? prompt.content, prompt.id);
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
        primary={
          <Box>
            <Typography fontWeight={600}>{prompt.title}</Typography>
            <MetaLine
              versionLabel={versionLabel ?? `v${prompt.versions?.length ? Math.max(...prompt.versions.map((v) => v.version)) : 1}`}
              publishedAt={prompt.publishedAt}
              visibility={prompt.visibility}
              owner={prompt.owner}
              isOwnPrompt={isOwnPrompt}
            />
          </Box>
        }
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
              <StarIcon sx={{ fontSize: "1rem" }} />
              <Typography variant="caption" color="text.secondary" mt={0.5}>
                {truncateCountDisplay(prompt.likes)} |
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
        aria-label={`Favorite prompt ${prompt.title}`}
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
