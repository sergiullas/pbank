import { Box } from "@mui/material";
import { ChatPane } from "../chat/ChatPane";
import { PromptBankPane } from "../promptBank/PromptBankPane";
import { useStore } from "../state/store";
import { TopBar } from "./TopBar";

export function AppShell() {
  const libraryCollapsed = useStore((state) => state.libraryCollapsed);

  return (
    <Box height="100vh" display="flex" flexDirection="column" >
      <TopBar />
      <Box display="flex" flex={1} minHeight={0}>
        <ChatPane />
        {!libraryCollapsed && <PromptBankPane />}
      </Box>
    </Box>
  );
}
