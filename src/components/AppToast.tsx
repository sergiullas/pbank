import { Snackbar, SnackbarContent } from "@mui/material";
import type { SnackbarCloseReason } from "@mui/material";

interface AppToastProps {
  open: boolean;
  message: string;
  severity?: "success" | "error" | "warning" | "info";
  autoHideDuration?: number;
  onClose: (reason?: SnackbarCloseReason) => void;
}

export function AppToast({
  open,
  message,
  severity = "info",
  autoHideDuration = 5000,
  onClose,
}: AppToastProps) {
  const role = severity === "error" ? "alert" : "status";
  const ariaLive = severity === "error" ? "assertive" : "polite";

  return (
    <Snackbar
      open={open}
      onClose={(_, reason) => onClose(reason)}
      autoHideDuration={autoHideDuration}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <SnackbarContent
        role={role}
        aria-live={ariaLive}
        message={message}
        sx={{
          bgcolor: "#2f2d36",
          color: "common.white",
          borderRadius: 1.5,
          fontSize: "1.05rem",
          px: 1,
        }}
      />
    </Snackbar>
  );
}
