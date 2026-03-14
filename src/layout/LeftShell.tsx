import { Avatar, Box, IconButton, Tooltip, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import { useStore } from "../state/store";

const EXPANDED_WIDTH = 280;
const RAIL_WIDTH = 64;

const SHELL_BG = "#f8fafc";
const SHELL_TEXT = "#0f172a";
const SHELL_SUBTEXT = "#64748b";
const ACTIVE_BG = "#e2e8f0";
const HOVER_BG = "#eef2f7";
const DIVIDER = "#e2e8f0";
const FOCUS_RING = "rgba(59, 130, 246, 0.35)";

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

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  isRail: boolean;
}

function NavItem({ icon, label, active = false, isRail }: NavItemProps) {
  const inner = (
    <Box
      role="button"
      tabIndex={0}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: isRail ? 0 : 2,
        mx: isRail ? "auto" : 1,
        borderRadius: 2,
        cursor: "pointer",
        color: active ? SHELL_TEXT : SHELL_SUBTEXT,
        bgcolor: active ? ACTIVE_BG : "transparent",
        justifyContent: isRail ? "center" : "flex-start",
        width: isRail ? 48 : "auto",
        height: 48,
        flexShrink: 0,
        transition: "background-color 150ms ease, color 150ms ease",
        "&:hover": {
          bgcolor: active ? ACTIVE_BG : HOVER_BG,
          color: SHELL_TEXT,
        },
        outline: "none",
        "&:focus-visible": {
          outline: `2px solid ${FOCUS_RING}`,
          outlineOffset: -2,
        },
      }}
    >
      {icon}
      <Typography
        variant="body2"
        sx={{
          fontWeight: active ? 600 : 400,
          color: "inherit",
          whiteSpace: "nowrap",
          overflow: "hidden",
          opacity: isRail ? 0 : 1,
          transform: isRail ? "translateX(-8px)" : "translateX(0)",
          transition: "opacity 160ms ease-out, transform 160ms ease-out",
          pointerEvents: "none",
        }}
      >
        {label}
      </Typography>
    </Box>
  );

  if (isRail) {
    return (
      <Tooltip title={label} placement="right">
        {inner}
      </Tooltip>
    );
  }

  return inner;
}

export function LeftShell() {
  const leftShellMode = useStore((state) => state.leftShellMode);
  const toggleLeftShell = useStore((state) => state.toggleLeftShell);
  const isRail = leftShellMode === "rail";
  const width = isRail ? RAIL_WIDTH : EXPANDED_WIDTH;

  return (
    <Box
      component="nav"
      aria-label="Application navigation"
      sx={{
        width,
        minWidth: width,
        height: "100%",
        bgcolor: SHELL_BG,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: "width 220ms ease-out, min-width 220ms ease-out",
        borderRight: `1px solid ${DIVIDER}`,
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          height: 56,
          display: "flex",
          alignItems: "center",
          px: isRail ? 0 : 2,
          gap: 1,
          flexShrink: 0,
          justifyContent: isRail ? "center" : "space-between",
          borderBottom: `1px solid ${DIVIDER}`,
        }}
      >
        {/* Brand */}
        <Tooltip title={isRail ? "Expand navigation" : ""} placement="right">
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              cursor: isRail ? "pointer" : "default",
              color: SHELL_TEXT,
              minWidth: 0,
              borderRadius: 1.5,
              p: isRail ? 0.5 : 0,
              transition: "background-color 150ms ease",
              ...(isRail && {
                "&:hover": { bgcolor: HOVER_BG },
              }),
            }}
            onClick={isRail ? toggleLeftShell : undefined}
            role={isRail ? "button" : undefined}
            tabIndex={isRail ? 0 : undefined}
            aria-label={isRail ? "Expand navigation" : undefined}
            onKeyDown={isRail ? (e) => e.key === "Enter" && toggleLeftShell() : undefined}
          >
            <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
              <MaterialSymbol name="nest_farsight_cool" size={28} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: SHELL_TEXT,
                fontSize: "1.05rem",
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                opacity: isRail ? 0 : 1,
                transform: isRail ? "translateX(-8px)" : "translateX(0)",
                transition: "opacity 160ms ease-out, transform 160ms ease-out",
                pointerEvents: "none",
              }}
            >
              samurAI
            </Typography>
          </Box>
        </Tooltip>

        {/* Collapse button — expanded only */}
        <Box
          sx={{
            opacity: isRail ? 0 : 1,
            transition: "opacity 160ms ease-out",
            pointerEvents: isRail ? "none" : "auto",
            flexShrink: 0,
          }}
        >
          <IconButton
            size="small"
            onClick={toggleLeftShell}
            sx={{
              color: SHELL_SUBTEXT,
              "&:hover": { color: SHELL_TEXT, bgcolor: HOVER_BG },
            }}
            aria-label="Collapse navigation"
            tabIndex={isRail ? -1 : 0}
          >
            <ChevronLeftIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Nav items */}
      <Box
        sx={{
          flex: 1,
          pt: 1,
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <NavItem
          icon={<ForumOutlinedIcon sx={{ fontSize: 22, flexShrink: 0 }} />}
          label="Chat"
          active
          isRail={isRail}
        />
        <NavItem
          icon={<AutoStoriesOutlinedIcon sx={{ fontSize: 22, flexShrink: 0 }} />}
          label="Prompt Manager"
          isRail={isRail}
        />
      </Box>

      {/* Bottom — avatar / account */}
      <Box
        sx={{
          px: isRail ? 0 : 2,
          py: 1.5,
          borderTop: `1px solid ${DIVIDER}`,
          display: "flex",
          alignItems: "center",
          justifyContent: isRail ? "center" : "flex-start",
          gap: 1.5,
          flexShrink: 0,
        }}
      >
        <Tooltip title="Account" placement="right">
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: "#dbe5f4",
              cursor: "pointer",
              fontSize: "0.875rem",
              flexShrink: 0,
              transition: "background-color 150ms ease",
              "&:hover": { bgcolor: "#cddbf1" },
            }}
            aria-label="Account settings"
          >
            U
          </Avatar>
        </Tooltip>
        <Box
          sx={{
            minWidth: 0,
            opacity: isRail ? 0 : 1,
            transform: isRail ? "translateX(-8px)" : "translateX(0)",
            transition: "opacity 160ms ease-out, transform 160ms ease-out",
            pointerEvents: isRail ? "none" : "auto",
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: SHELL_TEXT, fontWeight: 500, lineHeight: 1.3, whiteSpace: "nowrap" }}
          >
            User
          </Typography>
          <Typography variant="caption" sx={{ color: SHELL_SUBTEXT, lineHeight: 1.3 }}>
            Account settings
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
