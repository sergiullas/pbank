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

  return (
    <Stack
      spacing={1}
      px={isMobile ? 1.5 : 2}
      pb={isMobile ? 2 : 2}
      pt={isMobile ? 1 : 2}
      sx={{ width: "100%" }}
    >
      {showAttachmentWarning && <Alert severity="warning">{warningMessage}</Alert>}

      {/*
       * Unified card container on both mobile and desktop.
       * Mobile:   slightly more rounded, minRows=1, icon-only Prompt Library button.
       * Desktop:  same structure, minRows=2, Prompt Library button shows text.
       * Order: [ + ] [ input ] [ Prompt Library ] [ Send ]
       */}
      <Box
        sx={{
          border: 1,
          borderColor: "divider",
          borderRadius: isMobile ? 3 : 2,
          px: 1.5,
          pt: isMobile ? 1 : 1.25,
          pb: isMobile ? 0.75 : 1,
          bgcolor: "background.paper",
        }}
      >
        {/* Input row: attach button + textarea */}
        <Box display="flex" alignItems="flex-end" gap={isMobile ? 0.75 : 1}>
          <IconButton
            aria-label={hasAttachedFile ? "Remove attachment" : "Attach file"}
            onClick={() => setHasAttachedFile(!hasAttachedFile)}
            sx={{
              width: isMobile ? 36 : 32,
              height: isMobile ? 36 : 32,
              flexShrink: 0,
              color: hasAttachedFile ? "primary.main" : "text.secondary",
              ...(hasAttachedFile && { bgcolor: "action.selected" }),
            }}
          >
            <AddIcon fontSize="small" />
          </IconButton>

          <TextField
            fullWidth
            multiline
            variant="standard"
            minRows={isMobile ? 1 : 2}
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
            sx={{ py: "4px" }}
          />
        </Box>

        {/* Subtle divider separating input from actions */}
        <Box
          aria-hidden="true"
          sx={{
            height: "1px",
            bgcolor: "divider",
            opacity: 0.6,
            mx: -1.5,
            my: "6px",
          }}
        />

        {/* Actions row: prompt library + send */}
        <Box display="flex" alignItems="center" justifyContent="space-between" pt="2px">
          {isMobile ? (
            <IconButton
              aria-label="Open prompt library"
              onClick={(event) => onPromptLibraryToggle(event.currentTarget)}
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                flexShrink: 0,
                bgcolor: libraryOpen ? "action.selected" : "transparent",
                color: "text.primary",
                "&:hover": { bgcolor: libraryOpen ? "action.selected" : "action.hover" },
              }}
            >
              <ReviewsIcon fontSize="small" />
            </IconButton>
          ) : (
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
          )}

          <IconButton
            aria-label="Send message"
            onClick={sendMessage}
            disabled={sendDisabled}
            sx={{
              width: isMobile ? 36 : 40,
              height: isMobile ? 36 : 40,
              flexShrink: 0,
              bgcolor: sendDisabled ? "action.disabledBackground" : "primary.main",
              color: sendDisabled ? "action.disabled" : "primary.contrastText",
              "&:hover": { bgcolor: sendDisabled ? "action.disabledBackground" : "primary.dark" },
            }}
          >
            <SendIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Stack>
  );
}
