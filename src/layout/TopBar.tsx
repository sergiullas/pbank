import { AppBar, IconButton, Toolbar, Typography } from "@mui/material";
import ViewSidebarOutlinedIcon from "@mui/icons-material/ViewSidebarOutlined";

interface TopBarProps {
  isMobile: boolean;
  onOpenMobilePanel?: () => void;
}

export function TopBar({ isMobile, onOpenMobilePanel }: TopBarProps) {

  return (
    <AppBar position="static" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
      <Toolbar sx={{ minHeight: "56px !important" }}>
        <Typography variant="h6" component="h1" sx={{ flex: 1 }}>
          Prompt Bank
        </Typography>
        {isMobile && (
          <IconButton
            onClick={onOpenMobilePanel}
            aria-label="Open mobile panel"
            size="medium"
          >
            <ViewSidebarOutlinedIcon />
          </IconButton>
        )}
      </Toolbar>
    </AppBar>
  );
}
