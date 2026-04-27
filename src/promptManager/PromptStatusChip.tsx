import { Chip } from "@mui/material";
import type { PromptStatus } from "../types";

interface PromptStatusChipProps {
  status: PromptStatus;
  hasUnpublishedChanges?: boolean;
  size?: "small" | "medium";
}

const STATUS_CONFIG: Record<PromptStatus, { label: string; color: "default" | "success" | "warning" }> = {
  draft: { label: "Draft", color: "default" },
  published: { label: "Published", color: "success" },
  archived: { label: "Archived", color: "warning" },
};

export function PromptStatusChip({ status, hasUnpublishedChanges, size = "small" }: PromptStatusChipProps) {
  if (status === "published" && hasUnpublishedChanges) {
    return (
      <Chip
        label="Unpublished Changes"
        color="info"
        size={size}
        variant="outlined"
        sx={(theme) => ({
          bgcolor: theme.palette.info.light,
          color: theme.palette.info.dark,
          borderColor: theme.palette.info.main,
          fontWeight: 600,
        })}
      />
    );
  }

  const config = STATUS_CONFIG[status];
  return (
    <Chip
      label={config.label}
      color={config.color}
      size={size}
      variant={status === "published" ? "filled" : "outlined"}
      sx={(theme) => {
        if (status === "draft") {
          return {
            bgcolor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            borderColor: theme.palette.text.secondary,
            fontWeight: 600,
          };
        }
        if (status === "published") {
          return {
            bgcolor: theme.palette.success.dark,
            color: theme.palette.getContrastText(theme.palette.success.dark),
            fontWeight: 600,
          };
        }
        return {
          bgcolor: theme.palette.warning.light,
          color: theme.palette.warning.dark,
          borderColor: theme.palette.warning.main,
          fontWeight: 600,
        };
      }}
    />
  );
}
