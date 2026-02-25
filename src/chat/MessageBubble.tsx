import { Paper, Typography } from "@mui/material";
import type { Message } from "../types";

type MessageBubbleProps = {
  message: Message;
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        maxWidth: "80%",
        bgcolor: isUser ? "primary.main" : "grey.100",
        color: isUser ? "primary.contrastText" : "text.primary",
      }}
    >
      <Typography whiteSpace="pre-wrap">{message.content}</Typography>
    </Paper>
  );
}
