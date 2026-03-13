import { useCallback, useRef, useState } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { ChatPane } from "../chat/ChatPane";
import { PromptBankPane } from "../promptBank/PromptBankPane";
import { useStore } from "../state/store";
import { TopBar } from "./TopBar";
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

  return (
    <Box height="100vh" display="flex" flexDirection="column">
      <TopBar />
      <Box display="flex" flex={1} minHeight={0}>
        <ChatPane onPromptLibraryToggle={handlePromptLibraryToggle} />
        {!isMobile && !libraryCollapsed && <PromptBankPane />}
      </Box>
      {isMobile && (
        <MobileSecondaryDrawer
          open={isMobilePanelOpen}
          onClose={() => {
            setIsMobilePanelOpen(false);
            mobilePromptTriggerRef.current?.focus();
          }}
        />
      )}
    </Box>
  );
}
