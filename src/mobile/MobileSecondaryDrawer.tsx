import { Box, Divider, Drawer, IconButton, Typography, useTheme } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface MobileSecondaryDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSecondaryDrawer({ open, onClose }: MobileSecondaryDrawerProps) {
  const theme = useTheme();

  return (
    <Drawer
      anchor="right"
      variant="temporary"
      open={open}
      onClose={onClose}
      sx={{
        zIndex: theme.zIndex.drawer,
        "& .MuiDrawer-paper": {
          width: "85vw",
          maxWidth: 360,
          backgroundColor: theme.palette.background.default,
        },
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between" px={2} py={1.5}>
        <Typography variant="h6" component="h2">
          Prompt Library
        </Typography>
        <IconButton onClick={onClose} aria-label="Close mobile panel" size="small">
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <Box px={2} py={3}>
        <Typography variant="body2" color="text.secondary">
          Prompt Library mobile secondary panel placeholder. Future mobile prompt tools and browsing surfaces will appear here.
        </Typography>
        <Typography variant="body2" color="text.disabled" mt={1}>
          This drawer exists to test layout and responsive behavior.
        </Typography>
      </Box>
    </Drawer>
  );
}
