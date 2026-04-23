import { Chip } from "@mui/material";
import type { PromptStatus } from "../types";

interface PromptStatusChipProps {
  status: PromptStatus;
  hasUnpublishedChanges?: boolean;
  size?: "small" | "medium";
}

const STATUS_CONFIG: Record<
  PromptStatus,
  {
    label: string;
    color: "default" | "success" | "warning" | "error" | "info" | "primary" | "secondary";
    sx: Record<string, string | number>;
  }
> = {
  draft: {
    label: "Draft",
    color: "default",
    sx: {
      bgcolor: "#f8fafc",
      color: "#0f172a",
      borderColor: "#64748b",
      fontWeight: 600,
    },
  },
  published: {
    label: "Published",
    color: "success",
    sx: {
      bgcolor: "#166534",
      color: "#ffffff",
      fontWeight: 600,
    },
  },
  archived: {
    label: "Archived",
    color: "warning",
    sx: {
      bgcolor: "#fff7ed",
      color: "#9a3412",
      borderColor: "#c2410c",
      fontWeight: 600,
    },
  },
};

export function PromptStatusChip({ status, hasUnpublishedChanges, size = "small" }: PromptStatusChipProps) {
  if (status === "published" && hasUnpublishedChanges) {
    return (
      <Chip
        label="Unpublished Changes"
        color="info"
        size={size}
        variant="outlined"
        sx={{
          bgcolor: "#eff6ff",
          color: "#1e3a8a",
          borderColor: "#1d4ed8",
          fontWeight: 600,
        }}
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
      sx={config.sx}
    />
  );
}
