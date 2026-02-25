import SendIcon from "@mui/icons-material/Send";
import { Box, IconButton, TextField } from "@mui/material";
import { useEffect, useRef } from "react";
import { useStore } from "../state/store";

export function Composer() {
  const composerText = useStore((state) => state.composerText);
  const focusSignal = useStore((state) => state.composerFocusSignal);
  const setComposerText = useStore((state) => state.setComposerText);
  const sendMessage = useStore((state) => state.sendMessage);
  const textFieldRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = textFieldRef.current;
    if (!el) return;
    el.focus();
    const len = el.value.length;
    el.setSelectionRange(len, len);
  }, [focusSignal]);

  return (
    <Box p={2} borderTop={1} borderColor="divider" display="flex" alignItems="flex-end" gap={1}>
      <TextField
        fullWidth
        multiline
        minRows={2}
        maxRows={8}
        placeholder="Type your message..."
        value={composerText}
        inputRef={textFieldRef}
        onChange={(e) => setComposerText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
          }
        }}
      />
      <IconButton
        color="primary"
        aria-label="Send message"
        disabled={composerText.trim().length === 0}
        onClick={sendMessage}
      >
        <SendIcon />
      </IconButton>
    </Box>
  );
}
