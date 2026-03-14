import { Box, Typography } from "@mui/material";
import { useStore } from "../state/store";
import { Composer } from "./Composer";
import { MessageList } from "./MessageList";

interface ChatPaneProps {
  onPromptLibraryToggle: (triggerElement?: HTMLElement | null) => void;
}

export function ChatPane({ onPromptLibraryToggle }: ChatPaneProps) {
  const libraryCollapsed = useStore((state) => state.libraryCollapsed);

  return (
    <Box
      flex={1}
      minWidth={0}
      display="flex"
      flexDirection="column"
      borderRight={libraryCollapsed ? 0 : 1}
      borderColor="divider"
    >
      <Box px={2} py={1.5} borderBottom={1} borderColor="divider">
        <Typography variant="h6">New Chat</Typography>
      </Box>

      {/* Centered content column — matches Claude's ~700px reading column */}
      <Box flex={1} display="flex" overflow="hidden">
        <Box
          flex={1}
          display="flex"
          flexDirection="column"
          maxWidth={700}
          width="100%"
          mx="auto"
          overflow="hidden"
        >
          <MessageList />
          <Composer onPromptLibraryToggle={onPromptLibraryToggle} />
        </Box>
      </Box>
    </Box>
  );
}
