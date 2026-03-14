import MenuIcon from "@mui/icons-material/Menu";
import { AppBar, IconButton, Toolbar, Typography } from "@mui/material";

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  return (
    <AppBar position="static" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
      <Toolbar sx={{ minHeight: "56px !important" }}>
        <IconButton
          edge="start"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          sx={{ mr: 1, color: "text.primary" }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="h1" sx={{ flex: 1 }}>
          samurAI
        </Typography>
      </Toolbar>
    </AppBar>
  );
}
