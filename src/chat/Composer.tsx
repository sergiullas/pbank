import ReviewsIcon from '@mui/icons-material/Reviews';
import ReviewsOutlinedIcon from '@mui/icons-material/ReviewsOutlined';
import AddIcon from "@mui/icons-material/Add";
import ToggleButton from '@mui/material/ToggleButton';
import SendIcon from "@mui/icons-material/Send";
import Tooltip from '@mui/material/Tooltip';
import { Alert, Box, IconButton, Stack, TextField, useMediaQuery, useTheme } from "@mui/material";
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
  const setHasAttachedFile = useStore((state) => state.setHasAttachedFile);
  const composerError = useStore((state) => state.composerError);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
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
    <Stack p={2} spacing={1} sx={{ width: isMobile ? "100%" : "70%", margin: "0 auto" }}>
      {showAttachmentWarning && <Alert severity="warning">{warningMessage}</Alert>}
      <Box display="flex" alignItems="flex-end" gap={1.5}>
        <Tooltip title={hasAttachedFile ? "Remove attachment" : "Attach file"}>
          <IconButton
            aria-label={hasAttachedFile ? "Remove attachment" : "Attach file"}
            color={hasAttachedFile ? "primary" : "default"}
            onClick={() => setHasAttachedFile(!hasAttachedFile)}
            sx={{
              width: 48,
              height: 48,
              border: 1,
              borderColor: hasAttachedFile ? "primary.main" : "divider",
              bgcolor: hasAttachedFile ? "action.selected" : "transparent",
            }}
          >
            <AddIcon />
          </IconButton>
        </Tooltip>

        <TextField
          fullWidth
          multiline
          minRows={isMobile ? 1 : 2}
          maxRows={6}
          placeholder="Ask anything…"
          value={composerText}
          inputRef={textFieldRef}
          onChange={(e) => setComposerText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          inputProps={{ "aria-label": "Message input" }}
        />

        <Tooltip title={libraryCollapsed ? "Expand Prompt library" : "Collapse Prompt library"}>
          <ToggleButton
            value="check"
            selected={!libraryCollapsed}
            onChange={(event) => onPromptLibraryToggle(event.currentTarget)}
            color="primary"
            size="small"
            aria-label="Open prompt library"
            sx={{
              minWidth: isMobile ? 44 : 48,
              height: 48,
              px: isMobile ? 1 : 1.25,
              ml: 0.5,
              mr: isMobile ? 1.5 : 0,
            }}
          >
            {libraryCollapsed ? <ReviewsOutlinedIcon /> : <ReviewsIcon />}
          </ToggleButton>
        </Tooltip>

        <IconButton
          color="primary"
          aria-label="Send message"
          disabled={composerText.trim().length === 0}
          onClick={sendMessage}
          sx={{
            width: 48,
            height: 48,
            bgcolor: "primary.main",
            color: "primary.contrastText",
            "&:hover": { bgcolor: "primary.dark" },
            "&.Mui-disabled": {
              bgcolor: "action.disabledBackground",
              color: "action.disabled",
            },
          }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Stack>
  );
}
