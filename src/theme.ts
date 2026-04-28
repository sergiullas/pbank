import "@fontsource/lato/300.css";
import "@fontsource/lato/400.css";
import "@fontsource/lato/700.css";
import "@fontsource/lato/900.css";
import { createTheme } from "@mui/material";

declare module "@mui/material/styles" {
  interface TypeBackground {
    surface: string;
  }
}

export const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#005288",
    },
    secondary: {
      main: "#0078ae",
    },
    background: {
      default: "#f8fafc",
      paper: "#ffffff",
      surface: "#FAF9FC",
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
  typography: {
    fontFamily: '"Lato", sans-serif',
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButtonBase: {
      styleOverrides: {
        root: ({ theme }) => ({
          "&:focus-visible": {
            outline: `3px solid ${theme.palette.primary.main}`,
            outlineOffset: 2,
          },
        }),
      },
    },
  },
});
