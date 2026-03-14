import { createTheme } from "@mui/material";

export const appTheme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: "#f8fafc",
    },
    text: {
      primary: "#0f172a",
      secondary: "#64748b",
    },
    action: {
      selected: "#e2e8f0",
      hover: "#eef2f7",
    },
    divider: "#e2e8f0",
  },
  shape: {
    borderRadius: 12,
  },
});
