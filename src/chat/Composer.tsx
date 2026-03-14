import AddIcon from "@mui/icons-material/Add";
import ReviewsIcon from "@mui/icons-material/Reviews";
import SendIcon from "@mui/icons-material/Send";
import { Alert, Box, Button, IconButton, Stack, TextField, useMediaQuery, useTheme } from "@mui/material";
import { useEffect, useRef } from "react";
import { useStore } from "../state/store";

interface ComposerProps {
  onPromptLibraryToggle: (triggerElement?: HTMLElement | null) => void;
}

export function Composer({ onPromptLibraryToggle }: ComposerProps) {
  const composerText = useStore((state) => state.composerText);
  const focusSignal = useStore((state) => state.composerFocusSignal);
  const setComposerText = useStore((state) => state.setComposerText);
  const sendMessage = useStore((state) => state.sendMessage);
  const requiresAttachment = useStore((state) => state.requiresAttachment);
  const hasAttachedFile = useStore((state) => state.hasAttachedFile);
  const setHasAttachedFile = useStore((state) => state.setHasAttachedFile);
  const composerError = useStore((state) => state.composerError);
  const libraryCollapsed = useStore((state) => state.libraryCollapsed);
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
  const sendDisabled = composerText.trim().length === 0;
  const libraryOpen = !libraryCollapsed;

  const attachButtonSx = isMobile
    ? {
        width: 48,
        height: 48,
        border: 1,
        borderColor: hasAttachedFile ? "primary.main" : "divider",
        color: hasAttachedFile ? "primary.main" : "text.secondary",
        bgcolor: hasAttachedFile ? "action.selected" : "transparent",
        flexShrink: 0,
      }
    : {
        width: 32,
        height: 32,
        border: 1,
        borderColor: hasAttachedFile ? "primary.main" : "divider",
        color: hasAttachedFile ? "primary.main" : "text.secondary",
        flexShrink: 0,
      };

  const sendButtonSx = isMobile
    ? {
        width: 48,
        height: 48,
        flexShrink: 0,
        bgcolor: sendDisabled ? "action.disabledBackground" : "primary.main",
        color: sendDisabled ? "action.disabled" : "primary.contrastText",
        "&:hover": { bgcolor: sendDisabled ? "action.disabledBackground" : "primary.dark" },
      }
    : {
        width: 40,
        height: 40,
        flexShrink: 0,
        bgcolor: sendDisabled ? "action.disabledBackground" : "primary.main",
        color: sendDisabled ? "action.disabled" : "primary.contrastText",
        "&:hover": { bgcolor: sendDisabled ? "action.disabledBackground" : "primary.dark" },
      };

  return (
    <Stack p={2} spacing={1} sx={{ width: "100%" }}>
      {showAttachmentWarning && <Alert severity="warning">{warningMessage}</Alert>}

      {isMobile ? (
        /* Mobile: flat row with 48px touch targets, icon-only Prompt Library */
        <Box display="flex" alignItems="flex-end" gap={1.25}>
          <IconButton
            aria-label={hasAttachedFile ? "Remove attachment" : "Attach file"}
            onClick={() => setHasAttachedFile(!hasAttachedFile)}
            sx={attachButtonSx}
          >
            <AddIcon />
          </IconButton>

          <TextField
            fullWidth
            multiline
            minRows={1}
            maxRows={6}
            placeholder="Ask anything…"
            value={composerText}
            inputRef={textFieldRef}
            onChange={(event) => setComposerText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
              }
            }}
            inputProps={{ "aria-label": "Message input" }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5, minHeight: 48 } }}
          />

          <IconButton
            aria-label="Open prompt library"
            onClick={(event) => onPromptLibraryToggle(event.currentTarget)}
            sx={{
              width: 48,
              height: 48,
              borderRadius: 1.5,
              flexShrink: 0,
              border: 1,
              borderColor: libraryOpen ? "primary.main" : "divider",
              bgcolor: libraryOpen ? "action.selected" : "transparent",
              color: "text.primary",
            }}
          >
            <ReviewsIcon fontSize="small" />
          </IconButton>

          <IconButton
            aria-label="Send message"
            onClick={sendMessage}
            disabled={sendDisabled}
            sx={sendButtonSx}
          >
            <SendIcon />
          </IconButton>
        </Box>
      ) : (
        /* Desktop: card wrapper, same [ + ] [ input ] [ Prompt Library ] [ Send ] row */
        <Box
          sx={{
            border: 1,
            borderColor: "divider",
            borderRadius: 2,
            px: 1.5,
            py: 1.25,
            bgcolor: "background.paper",
          }}
        >
          <Box display="flex" alignItems="flex-end" gap={1}>
            <IconButton
              aria-label={hasAttachedFile ? "Remove attachment" : "Attach file"}
              onClick={() => setHasAttachedFile(!hasAttachedFile)}
              sx={attachButtonSx}
            >
              <AddIcon fontSize="small" />
            </IconButton>

            <TextField
              fullWidth
              multiline
              variant="standard"
              minRows={2}
              maxRows={6}
              placeholder="Ask anything…"
              value={composerText}
              inputRef={textFieldRef}
              onChange={(event) => setComposerText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              inputProps={{ "aria-label": "Message input" }}
              InputProps={{ disableUnderline: true }}
            />

            <Button
              onClick={(event) => onPromptLibraryToggle(event.currentTarget)}
              variant="text"
              startIcon={<ReviewsIcon fontSize="small" />}
              aria-label="Open prompt library"
              sx={{
                textTransform: "none",
                borderRadius: 999,
                flexShrink: 0,
                bgcolor: libraryOpen ? "action.selected" : "transparent",
                color: "text.primary",
                "&:hover": { bgcolor: libraryOpen ? "action.selected" : "action.hover" },
              }}
            >
              Prompt Library
            </Button>

            <IconButton
              aria-label="Send message"
              onClick={sendMessage}
              disabled={sendDisabled}
              sx={sendButtonSx}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      )}
    </Stack>
  );
}
