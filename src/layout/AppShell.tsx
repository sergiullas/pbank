import { useCallback, useRef, useState } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { ChatPane } from "../chat/ChatPane";
import { PromptBankPane } from "../promptBank/PromptBankPane";
import { useStore } from "../state/store";
import { TopBar } from "./TopBar";
import { MobileSecondaryDrawer } from "../mobile/MobileSecondaryDrawer";

export function AppShell() {
  const setLibraryCollapsed = useStore((state) => state.setLibraryCollapsed);
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

    setLibraryCollapsed(false);
  }, [isMobile, setLibraryCollapsed]);

  return (
    <Box height="100vh" display="flex" flexDirection="column">
      <TopBar />
      <Box display="flex" flex={1} minHeight={0}>
        {!isMobile && <PromptBankPane />}
        <ChatPane onPromptLibraryToggle={handlePromptLibraryToggle} />
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
