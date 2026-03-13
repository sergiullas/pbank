import { AppBar, IconButton, Toolbar, Typography, useMediaQuery, useTheme } from "@mui/material";
import ViewSidebarOutlinedIcon from "@mui/icons-material/ViewSidebarOutlined";

interface TopBarProps {
  onOpenMobilePanel?: () => void;
}

export function TopBar({ onOpenMobilePanel }: TopBarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

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
