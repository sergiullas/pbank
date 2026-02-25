import { AppBar, Toolbar, Typography } from "@mui/material";

export function TopBar() {
  return (
    <AppBar position="static" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
      <Toolbar sx={{ minHeight: "56px !important" }}>
        <Typography variant="h6" component="h1">
          Prompt Bank
        </Typography>
      </Toolbar>
    </AppBar>
  );
}
