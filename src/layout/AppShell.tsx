import { useState } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { ChatPane } from "../chat/ChatPane";
import { PromptBankPane } from "../promptBank/PromptBankPane";
import { useStore } from "../state/store";
import { TopBar } from "./TopBar";
import { MobileSecondaryDrawer } from "../mobile/MobileSecondaryDrawer";

export function AppShell() {
  const libraryCollapsed = useStore((state) => state.libraryCollapsed);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);

  return (
    <Box height="100vh" display="flex" flexDirection="column">
      <TopBar onOpenMobilePanel={() => setIsMobilePanelOpen(true)} />
      <Box display="flex" flex={1} minHeight={0}>
        <ChatPane />
        {!isMobile && !libraryCollapsed && <PromptBankPane />}
      </Box>
      {isMobile && (
        <MobileSecondaryDrawer
          open={isMobilePanelOpen}
          onClose={() => setIsMobilePanelOpen(false)}
        />
      )}
    </Box>
  );
}
