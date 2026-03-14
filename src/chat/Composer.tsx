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

  return (
    <Stack p={2} spacing={1} sx={{ width: "100%", margin: "0 auto" }}>
      {showAttachmentWarning && <Alert severity="warning">{warningMessage}</Alert>}

      {isMobile ? (
        <Box display="flex" alignItems="flex-end" gap={1.25}>
          <IconButton
            aria-label={hasAttachedFile ? "Remove attachment" : "Attach file"}
            onClick={() => setHasAttachedFile(!hasAttachedFile)}
            sx={{
              width: 48,
              height: 48,
              border: 1,
              borderColor: hasAttachedFile ? "primary.main" : "divider",
              color: hasAttachedFile ? "primary.main" : "text.secondary",
              bgcolor: hasAttachedFile ? "action.selected" : "transparent",
            }}
          >
            <AddIcon />
          </IconButton>

          <TextField
            fullWidth
            multiline
            minRows={1}
            maxRows={6}
            placeholder="Ask anything..."
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
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 1.5,
                minHeight: 48,
              },
            }}
          />

          <IconButton
            aria-label="Open prompt library"
            onClick={(event) => onPromptLibraryToggle(event.currentTarget)}
            sx={{
              width: 48,
              height: 48,
              borderRadius: 1.5,
              border: 1,
              borderColor: !libraryCollapsed ? "primary.main" : "divider",
              bgcolor: !libraryCollapsed ? "primary.50" : "action.hover",
              color: "primary.main",
            }}
          >
            <ReviewsIcon fontSize="small" />
          </IconButton>

          <IconButton
            aria-label="Send message"
            onClick={sendMessage}
            disabled={sendDisabled}
            sx={{
              width: 48,
              height: 48,
              bgcolor: sendDisabled ? "action.disabledBackground" : "primary.main",
              color: sendDisabled ? "action.disabled" : "primary.contrastText",
              "&:hover": {
                bgcolor: sendDisabled ? "action.disabledBackground" : "primary.dark",
              },
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      ) : (
        <Box
          sx={{
            width: "min(642px, 100%)",
            minHeight: 120,
            boxSizing: "border-box",
            border: 1,
            borderColor: "divider",
            borderRadius: 2,
            p: 1.5,
            mx: "auto",
            bgcolor: "background.paper",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <TextField
            fullWidth
            multiline
            variant="standard"
            minRows={2}
            maxRows={6}
            placeholder="Ask anything..."
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

          <Box display="flex" alignItems="center" justifyContent="space-between" minHeight={32}>
            <IconButton
              aria-label={hasAttachedFile ? "Remove attachment" : "Attach file"}
              onClick={() => setHasAttachedFile(!hasAttachedFile)}
              sx={{
                width: 28,
                height: 28,
                border: 1,
                borderColor: hasAttachedFile ? "primary.main" : "divider",
                color: hasAttachedFile ? "primary.main" : "text.secondary",
              }}
            >
              <AddIcon fontSize="small" />
            </IconButton>

            <Box display="flex" alignItems="center" gap={1.5}>
              <Button
                onClick={(event) => onPromptLibraryToggle(event.currentTarget)}
                variant={!libraryCollapsed ? "contained" : "text"}
                startIcon={<ReviewsIcon fontSize="small" />}
                aria-label="Open prompt library"
                sx={{
                  textTransform: "none",
                  borderRadius: 999,
                  minHeight: 28,
                  px: 1.25,
                  fontSize: 14,
                }}
              >
                Prompt Library
              </Button>
              <IconButton
                aria-label="Send message"
                onClick={sendMessage}
                disabled={sendDisabled}
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: sendDisabled ? "action.disabledBackground" : "primary.main",
                  color: sendDisabled ? "action.disabled" : "primary.contrastText",
                  "&:hover": {
                    bgcolor: sendDisabled ? "action.disabledBackground" : "primary.dark",
                  },
                }}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>
      )}
    </Stack>
  );
}
