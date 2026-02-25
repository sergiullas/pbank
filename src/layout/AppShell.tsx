import { Box } from "@mui/material";
import { ChatPane } from "../chat/ChatPane";
import { PromptBankPane } from "../promptBank/PromptBankPane";
import { TopBar } from "./TopBar";

export function AppShell() {
  return (
    <Box height="100vh" display="flex" flexDirection="column">
      <TopBar />
      <Box display="flex" flex={1} minHeight={0}>
        <ChatPane />
        <PromptBankPane />
      </Box>
    </Box>
  );
}
