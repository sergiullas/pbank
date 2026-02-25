import { Box, Typography } from "@mui/material";
import { useStore } from "../state/store";
import { Composer } from "./Composer";
import { MessageList } from "./MessageList";

export function ChatPane() {
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
      <MessageList />
      <Composer />
    </Box>
  );
}
