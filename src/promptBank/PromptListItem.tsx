import { Chip, ListItemButton, ListItemText, Stack, Typography } from "@mui/material";
import type { Prompt } from "../types";

type PromptListItemProps = {
  prompt: Prompt;
  selected: boolean;
  onSelect: (id: string) => void;
};

export function PromptListItem({ prompt, selected, onSelect }: PromptListItemProps) {
  return (
    <ListItemButton selected={selected} onClick={() => onSelect(prompt.id)} alignItems="flex-start">
      <ListItemText
        primary={<Typography fontWeight={600}>{prompt.title}</Typography>}
        secondary={
          <Stack spacing={0.75} mt={0.5}>
            <Typography variant="caption" color="text.secondary">
              {prompt.category ?? "General"}
            </Typography>
            <Stack direction="row" spacing={0.5} flexWrap="wrap">
              {prompt.tags.slice(0, 2).map((tag) => (
                <Chip size="small" key={tag} label={tag} />
              ))}
            </Stack>
          </Stack>
        }
      />
    </ListItemButton>
  );
}
