import { Box, Typography } from "@mui/material";
import { Composer } from "./Composer";
import { MessageList } from "./MessageList";

interface ChatPaneProps {
  onPromptLibraryToggle: (triggerElement?: HTMLElement | null) => void;
}

export function ChatPane({ onPromptLibraryToggle }: ChatPaneProps) {
  return (
    <Box
      flex={1}
      minWidth={0}
      display="flex"
      flexDirection="column"
    >
      <Box px={2} py={1.5} borderBottom={1} borderColor="divider">
        <Typography variant="h6">New Chat</Typography>
      </Box>
      <MessageList />
      <Composer onPromptLibraryToggle={onPromptLibraryToggle} />
    </Box>
  );
}
