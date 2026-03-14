import { useCallback, useRef, useState } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { ChatPane } from "../chat/ChatPane";
import { PromptBankPane } from "../promptBank/PromptBankPane";
import { useStore } from "../state/store";
import { TopBar } from "./TopBar";
import { LeftShell } from "./LeftShell";
import { MobileSecondaryDrawer } from "../mobile/MobileSecondaryDrawer";

export function AppShell() {
  const libraryCollapsed = useStore((state) => state.libraryCollapsed);
  const toggleLibraryCollapsed = useStore((state) => state.toggleLibraryCollapsed);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const mobilePromptTriggerRef = useRef<HTMLElement | null>(null);

  const handlePromptLibraryToggle = useCallback((triggerElement?: HTMLElement | null) => {
    if (isMobile) {
      if (triggerElement) mobilePromptTriggerRef.current = triggerElement;
      setIsMobilePanelOpen(true);
      return;
    }

    toggleLibraryCollapsed();
  }, [isMobile, toggleLibraryCollapsed]);

  if (isMobile) {
    return (
      <Box height="100vh" display="flex" flexDirection="column">
        <TopBar />
        <Box display="flex" flex={1} minHeight={0}>
          <ChatPane onPromptLibraryToggle={handlePromptLibraryToggle} />
        </Box>
        <MobileSecondaryDrawer
          open={isMobilePanelOpen}
          onClose={() => {
            setIsMobilePanelOpen(false);
            mobilePromptTriggerRef.current?.focus();
          }}
        />
      </Box>
    );
  }

  // Desktop: three-column layout — LeftShell | ChatWorkspace | RightPromptLibrary
  return (
    <Box height="100vh" display="flex" flexDirection="row" overflow="hidden">
      <LeftShell />
      <Box display="flex" flex={1} minWidth={0} flexDirection="column">
        <ChatPane onPromptLibraryToggle={handlePromptLibraryToggle} />
      </Box>
      {!libraryCollapsed && <PromptBankPane />}
    </Box>
  );
}
