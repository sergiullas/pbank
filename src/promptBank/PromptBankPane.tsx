import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { Avatar, Box, Icon, IconButton, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useStore } from "../state/store";
import { PromptBrowseView } from "./PromptBrowseView";
import { PromptDetailView } from "./PromptDetailView";

const PANEL_WIDTH = 320;
const RAIL_WIDTH = 64;

export function PromptBankPane() {
  const libraryCollapsed = useStore((state) => state.libraryCollapsed);
  const toggleLibraryCollapsed = useStore((state) => state.toggleLibraryCollapsed);
  const libraryView = useStore((state) => state.libraryView);
  const selectedPromptId = useStore((state) => state.selectedPromptId);
  const detailInitialVersionNumber = useStore((state) => state.detailInitialVersionNumber);

  const expanded = !libraryCollapsed;

  return (
    <Box
      sx={{
        width: expanded ? PANEL_WIDTH : RAIL_WIDTH,
        minWidth: expanded ? PANEL_WIDTH : RAIL_WIDTH,
        maxWidth: expanded ? PANEL_WIDTH : RAIL_WIDTH,
        borderRight: 1,
        borderColor: "divider",
        overflow: "hidden",
        transition: "width 220ms ease-out, min-width 220ms ease-out, max-width 220ms ease-out",
        bgcolor: "background.paper",
      }}
    >
      {expanded ? (
        <Box
          display="flex"
          flexDirection="column"
          height="100%"
          sx={{
            opacity: 1,
            transform: "translateX(0)",
            transition: "opacity 160ms ease-out 40ms, transform 160ms ease-out 40ms",
          }}
        >
          <Box
            sx={{
              height: 56,
              px: 2,
              borderBottom: 1,
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Icon sx={{ fontSize: 28 }}>nest_farsight_cool</Icon>
              <Typography fontWeight={600}>samurAI</Typography>
            </Box>

            <IconButton
              aria-label="Collapse panel"
              onClick={toggleLibraryCollapsed}
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1.5,
                "&:hover": {
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              <ChevronLeftIcon sx={{ fontSize: 22 }} />
            </IconButton>
          </Box>

          <Typography sx={{ px: 2, pt: 1.5, pb: 1, fontSize: 15, fontWeight: 600 }}>
            Prompt Library
          </Typography>

          <Box flex={1} minHeight={0}>
            {libraryView === "browse" ? (
              <PromptBrowseView />
            ) : (
              <PromptDetailView key={`${selectedPromptId ?? "none"}:${detailInitialVersionNumber ?? "latest"}`} />
            )}
          </Box>
        </Box>
      ) : (
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="space-between"
          alignItems="center"
          height="100%"
          py={2}
        >
          <Box display="flex" flexDirection="column" gap={1.5} width="100%" alignItems="center">
            <Tooltip title="samurAI" placement="right" enterDelay={300}>
              <IconButton
                aria-label="Open samurAI panel"
                onClick={toggleLibraryCollapsed}
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1.5,
                  position: "relative",
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                  color: "primary.main",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    left: -8,
                    width: 2,
                    height: 24,
                    borderRadius: 999,
                    bgcolor: "primary.main",
                  },
                  transition: "background-color 140ms ease-out, transform 140ms ease-out, color 140ms ease-out",
                  "&:hover": {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.18),
                    transform: "scale(1.03)",
                  },
                }}
              >
                <Icon sx={{ fontSize: 24 }}>nest_farsight_cool</Icon>
              </IconButton>
            </Tooltip>
          </Box>

          <Tooltip title="User" placement="right" enterDelay={300}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                fontSize: 14,
                bgcolor: "primary.main",
              }}
            >
              S
            </Avatar>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
}
