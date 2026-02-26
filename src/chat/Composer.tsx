import ReviewsIcon from '@mui/icons-material/Reviews';
import ReviewsOutlinedIcon from '@mui/icons-material/ReviewsOutlined';
import ToggleButton from '@mui/material/ToggleButton';
import SendIcon from "@mui/icons-material/Send";
import Tooltip from '@mui/material/Tooltip';
import { Box, IconButton, TextField } from "@mui/material";
import { useEffect, useRef } from "react";
import { useStore } from "../state/store";

export function Composer() {
  const composerText = useStore((state) => state.composerText);
  const focusSignal = useStore((state) => state.composerFocusSignal);
  const libraryCollapsed = useStore((state) => state.libraryCollapsed);
  const setComposerText = useStore((state) => state.setComposerText);
  const toggleLibraryCollapsed = useStore((state) => state.toggleLibraryCollapsed);
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
    <Box p={2} display="flex" alignItems="flex-end" gap={1}
      sx={{
        width: "70%",            // 80% of viewport width
        margin: "0 auto",         // center horizontally
      }}
    >
      <TextField
        fullWidth
        multiline
        minRows={2}
        maxRows={8}
        placeholder="Type a question or explore our prompt library for inspiration"
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

<Tooltip title={libraryCollapsed ? "Expand Prompt library" : "Collapse Prompt library"}>
  <ToggleButton
    value="check"
    selected={!libraryCollapsed}
    onChange={toggleLibraryCollapsed}
    color="primary"
    size="small"
  >
    {libraryCollapsed ? <ReviewsOutlinedIcon /> : <ReviewsIcon />}
  </ToggleButton>
</Tooltip>

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
