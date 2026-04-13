import { Chip } from "@mui/material";
import type { PromptStatus } from "../types";

interface PromptStatusChipProps {
  status: PromptStatus;
  hasUnpublishedChanges?: boolean;
  size?: "small" | "medium";
}

const STATUS_CONFIG: Record<PromptStatus, { label: string; color: "default" | "success" | "warning" | "error" | "info" | "primary" | "secondary" }> = {
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
    />
  );
}
