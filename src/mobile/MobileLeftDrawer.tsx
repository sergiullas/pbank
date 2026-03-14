import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import CloseIcon from "@mui/icons-material/Close";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import { Avatar, Box, Drawer, IconButton, Typography, useTheme } from "@mui/material";

function MaterialSymbol({ name, size = 24 }: { name: string; size?: number }) {
  return (
    <span
      className="material-symbols-rounded"
      style={{ fontSize: size, lineHeight: 1, color: "inherit", userSelect: "none" }}
    >
      {name}
    </span>
  );
}

interface NavRowProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

function NavRow({ icon, label, active = false }: NavRowProps) {
  return (
    <Box
      role="button"
      tabIndex={0}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 2,
        mx: 1,
        height: 48,
        borderRadius: 2,
        cursor: "pointer",
        color: active ? "text.primary" : "text.secondary",
        bgcolor: active ? "action.selected" : "transparent",
        "&:hover": { bgcolor: active ? "action.selected" : "action.hover", color: "text.primary" },
        outline: "none",
        "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: -2 },
      }}
    >
      {icon}
      <Typography
        variant="body2"
        sx={{ fontWeight: active ? 600 : 400, color: "inherit" }}
      >
        {label}
      </Typography>
    </Box>
  );
}

interface MobileLeftDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MobileLeftDrawer({ open, onClose }: MobileLeftDrawerProps) {
  const theme = useTheme();

  return (
    <Drawer
      anchor="left"
      variant="temporary"
      open={open}
      onClose={onClose}
      aria-label="Navigation menu"
      sx={{
        zIndex: theme.zIndex.drawer,
        "& .MuiDrawer-paper": {
          width: "80vw",
          maxWidth: 320,
          backgroundColor: theme.palette.background.default,
        },
      }}
    >
      <Box display="flex" flexDirection="column" height="100%">
        {/* Header — brand + close */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          px={2}
          py={1.5}
          borderBottom={1}
          borderColor="divider"
          flexShrink={0}
        >
          <Box display="flex" alignItems="center" gap={1} color="text.primary">
            <MaterialSymbol name="nest_farsight_cool" size={28} />
            <Typography variant="h6" fontWeight={700} fontSize="1.05rem" letterSpacing="-0.01em">
              samurAI
            </Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="Close navigation menu" size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Nav items */}
        <Box flex={1} pt={1} display="flex" flexDirection="column" gap={0.5}>
          <NavRow
            icon={<ForumOutlinedIcon sx={{ fontSize: 22 }} />}
            label="Chat"
            active
          />
          <NavRow
            icon={<AutoStoriesOutlinedIcon sx={{ fontSize: 22 }} />}
            label="Prompt Manager"
          />
        </Box>

        {/* Account */}
        <Box
          borderTop={1}
          borderColor="divider"
          px={2}
          py={1.5}
          display="flex"
          alignItems="center"
          gap={1.5}
          flexShrink={0}
        >
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: "action.selected",
              color: "text.primary",
              fontSize: "0.875rem",
              cursor: "pointer",
              "&:hover": { bgcolor: "action.hover" },
            }}
            aria-label="Account settings"
          >
            U
          </Avatar>
          <Box minWidth={0}>
            <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 500, lineHeight: 1.3 }}>
              User
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: 1.3 }}>
              Account settings
            </Typography>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}
