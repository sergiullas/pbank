import { Box, Stack, Typography } from "@mui/material";
import { useEffect, useRef } from "react";
import { useStore } from "../state/store";
import { MessageBubble } from "./MessageBubble";

export function MessageList() {
  const messages = useStore((state) => state.messages);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <Box flex={1} display="flex" alignItems="center" justifyContent="center" px={4}>
        <Stack spacing={1} textAlign="center">
          <Typography color="text.secondary">Start typing, or explore a template on the right.</Typography>
          <Typography variant="body2" color="text.disabled">
            Templates can be inserted into your message at any time.
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box flex={1} overflow="auto" px={2} py={2}>
      <Stack spacing={1.5}>
        {messages.map((message) => (
          <Box key={message.id} display="flex" justifyContent={message.role === "user" ? "flex-end" : "flex-start"}>
            <MessageBubble message={message} />
          </Box>
        ))}
      </Stack>
      <Box ref={bottomRef} />
    </Box>
  );
}
