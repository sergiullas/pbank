import ReviewsIcon from '@mui/icons-material/Reviews';
import ReviewsOutlinedIcon from '@mui/icons-material/ReviewsOutlined';
import ToggleButton from '@mui/material/ToggleButton';
import SendIcon from "@mui/icons-material/Send";
import Tooltip from '@mui/material/Tooltip';
import { Alert, Box, IconButton, Stack, TextField } from "@mui/material";
import { useEffect, useRef } from "react";
import { useStore } from "../state/store";

interface ComposerProps {
  onPromptLibraryToggle: (triggerElement?: HTMLElement | null) => void;
}

export function Composer({ onPromptLibraryToggle }: ComposerProps) {
  const composerText = useStore((state) => state.composerText);
  const focusSignal = useStore((state) => state.composerFocusSignal);
  const libraryCollapsed = useStore((state) => state.libraryCollapsed);
  const setComposerText = useStore((state) => state.setComposerText);
  const sendMessage = useStore((state) => state.sendMessage);
  const requiresAttachment = useStore((state) => state.requiresAttachment);
  const hasAttachedFile = useStore((state) => state.hasAttachedFile);
  const composerError = useStore((state) => state.composerError);
  const textFieldRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = textFieldRef.current;
    if (!el) return;
    el.focus();
    const len = el.value.length;
    el.setSelectionRange(len, len);
  }, [focusSignal]);

  const showAttachmentWarning = requiresAttachment && !hasAttachedFile;
  const warningMessage = composerError ?? "Attach a file before sending this prompt.";

  return (
    <Stack p={2} spacing={1} sx={{ width: "70%", margin: "0 auto" }}>
      {showAttachmentWarning && <Alert severity="warning">{warningMessage}</Alert>}
      <Box display="flex" alignItems="flex-end" gap={1}>
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
            onChange={(event) => onPromptLibraryToggle(event.currentTarget)}
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
    </Stack>
  );
}
