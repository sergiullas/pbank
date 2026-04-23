import { createTheme } from "@mui/material";

export const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#005288",
    },
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
  components: {
    MuiButtonBase: {
      styleOverrides: {
        root: {
          "&:focus-visible": {
            outline: "3px solid #005288",
            outlineOffset: 2,
          },
        },
      },
    },
  },
});
