import GroupIcon from "@mui/icons-material/Group";
import LockIcon from "@mui/icons-material/Lock";
import PublicIcon from "@mui/icons-material/Public";
import { Alert, Button, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import type { SharedWith, VisibilityLevel } from "../types";

type VisibilityControlProps = {
  value: VisibilityLevel;
  sharedWith: SharedWith;
  onChange: (visibility: VisibilityLevel) => void;
  onManage: () => void;
  readOnly?: boolean;
};

export function VisibilityControl({ value, sharedWith, onChange, onManage, readOnly = false }: VisibilityControlProps) {
  const sharedUserCount = sharedWith.users.length;
  const showEmptyWarning = value === "shared" && sharedUserCount === 0;

  return (
    <Stack spacing={1.5}>
      <Typography variant="overline" color="text.secondary" letterSpacing={1}>
        Visibility
      </Typography>

      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={(_, next: VisibilityLevel | null) => {
          if (next && !readOnly) onChange(next);
        }}
        size="small"
        aria-label="Prompt visibility"
        disabled={readOnly}
      >
        <ToggleButton
          value="private"
          aria-label="Private — only you can access"
        >
          <LockIcon fontSize="small" sx={{ mr: 0.75 }} />
          Private
        </ToggleButton>
        <ToggleButton
          value="shared"
          aria-label="Shared — selected people can access"
        >
          <GroupIcon fontSize="small" sx={{ mr: 0.75 }} />
          Shared
        </ToggleButton>
        <ToggleButton
          value="organization"
          aria-label="Organization — everyone can access"
        >
          <PublicIcon fontSize="small" sx={{ mr: 0.75 }} />
          Organization
        </ToggleButton>
      </ToggleButtonGroup>

      {value === "shared" && (
        showEmptyWarning ? (
          <Alert
            severity="warning"
            action={
              !readOnly ? (
                <Button size="small" color="warning" onClick={onManage}>
                  Add People
                </Button>
              ) : undefined
            }
          >
            Add at least one person or change visibility to Private.
          </Alert>
        ) : (
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack spacing={0.25}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Shared with
              </Typography>
              <Typography variant="body2">
                {sharedUserCount} {sharedUserCount === 1 ? "person" : "people"}
              </Typography>
            </Stack>
            {!readOnly && (
              <Button size="small" variant="outlined" onClick={onManage} aria-label="Manage shared access">
                Manage
              </Button>
            )}
          </Stack>
        )
      )}
    </Stack>
  );
}
