import CloseIcon from "@mui/icons-material/Close";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { parseTemplateVariables } from "../promptBank/templateVariables";
import { renderPromptTestTemplate, runPromptTest } from "./runPromptTest";

interface PromptTestPanelProps {
  template: string;
  onClose: () => void;
}

type RunStatus = "idle" | "loading" | "success" | "error";

export function PromptTestPanel({ template, onClose }: PromptTestPanelProps) {
  const { variables, invalidTokens } = useMemo(() => parseTemplateVariables(template), [template]);
  const hasContextVariable = variables.some((variable) => variable.isContext);
  const nonContextVariables = variables.filter((variable) => !variable.isContext);

  const [values, setValues] = useState<Record<string, string>>({});
  const [useContext, setUseContext] = useState(hasContextVariable);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [renderedPrompt, setRenderedPrompt] = useState<string | null>(null);
  const [showRenderedPrompt, setShowRenderedPrompt] = useState(false);
  const [showExpandedResponse, setShowExpandedResponse] = useState(false);
  const [runStatus, setRunStatus] = useState<RunStatus>("idle");
  const [hasRunOnce, setHasRunOnce] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const aiResponseHeadingRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    if (!hasRunOnce || runStatus === "loading") {
      return;
    }

    aiResponseHeadingRef.current?.focus();
  }, [hasRunOnce, runStatus]);

  const runDisabled = runStatus === "loading" || invalidTokens.length > 0;

  const handleRun = async () => {
    setHasRunOnce(true);
    setRunStatus("loading");
    setErrorMessage(null);
    setResult(null);
    setRenderedPrompt(null);

    try {
      const input = {
        template,
        variables: values,
        attachment: useContext ? file ?? undefined : undefined,
      };
      const [nextRenderedPrompt, nextResult] = await Promise.all([
        renderPromptTestTemplate(input),
        runPromptTest(input),
      ]);
      setRenderedPrompt(nextRenderedPrompt);
      setResult(nextResult);
      setRunStatus("success");
    } catch {
      setRunStatus("error");
      setErrorMessage("Something went wrong. Try again.");
    }
  };

  return (
    <Box
      width={{ xs: "100%", lg: "38%" }}
      minWidth={{ xs: "100%", lg: 360 }}
      maxWidth={{ xs: "100%", lg: 560 }}
      borderLeft={{ xs: 0, lg: 1 }}
      borderTop={{ xs: 1, lg: 0 }}
      borderColor="divider"
      bgcolor="background.paper"
      display="flex"
      flexDirection="column"
      height="100%"
      minHeight={0}
      overflow="hidden"
    >
      <Box px={2} py={1.5} borderBottom={1} borderColor="divider" display="flex" alignItems="center" gap={1}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ flex: 1 }}>
          Test Prompt
        </Typography>
        <IconButton size="small" onClick={onClose} aria-label="Close prompt test panel">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box p={2} flex={1} minHeight={0} display="flex" flexDirection="column" gap={2} sx={{ overflowY: "auto" }}>
        {invalidTokens.length > 0 && (
          <Alert severity="error" role="status" aria-live="polite">
            {invalidTokens.map((invalidToken) => (
              <Typography key={`${invalidToken.raw}-${invalidToken.message}`} variant="body2">
                <code>{invalidToken.raw}</code> — {invalidToken.message}
              </Typography>
            ))}
          </Alert>
        )}

        <Box
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            p: 1.25,
            minHeight: 110,
            maxHeight: "35%",
            overflowY: "auto",
            flexShrink: 0,
          }}
        >
          <Stack spacing={1.25}>
            {nonContextVariables.map((variable) => (
              <TextField
                key={variable.token}
                label={variable.raw}
                value={values[variable.token] ?? ""}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, [variable.token]: event.target.value }))
                }
                fullWidth
                size="small"
                disabled={runStatus === "loading"}
                multiline={variable.type === "textarea"}
                minRows={variable.type === "textarea" ? 2 : 1}
                maxRows={variable.type === "textarea" ? 8 : 1}
                sx={
                  variable.type === "textarea"
                    ? {
                        "& .MuiInputBase-inputMultiline": {
                          maxHeight: "25vh",
                          overflowY: "auto !important",
                          resize: "none",
                        },
                      }
                    : undefined
                }
              />
            ))}

            {hasContextVariable && (
              <Stack spacing={1}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={useContext}
                      disabled={runStatus === "loading"}
                      onChange={(event) => {
                        setUseContext(event.target.checked);
                        if (!event.target.checked) setFile(null);
                      }}
                    />
                  }
                  label="Use attached file as context"
                />

                {useContext && (
                  <Stack spacing={0.75}>
                    <Button variant="outlined" component="label" disabled={runStatus === "loading"}>
                      {file ? "Replace file" : "Attach file"}
                      <input
                        type="file"
                        hidden
                        disabled={runStatus === "loading"}
                        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                      />
                    </Button>
                    <Typography variant="caption" color="text.secondary" aria-live="polite">
                      {file ? `Attached file: ${file.name}` : "No file attached"}
                    </Typography>
                  </Stack>
                )}
              </Stack>
            )}
          </Stack>
        </Box>

        <Button
          variant="contained"
          onClick={handleRun}
          disabled={runDisabled}
          fullWidth
          sx={{ flexShrink: 0 }}
          startIcon={runStatus === "loading" ? <CircularProgress color="inherit" size={16} /> : undefined}
        >
          {runStatus === "loading" ? "Running..." : "Run Test"}
        </Button>

        {!hasRunOnce && (
          <Typography variant="body2" color="text.secondary">
            Run a test to see results
          </Typography>
        )}

        {hasRunOnce && (
          <Box display="flex" flexDirection="column" gap={1.5} minHeight={0}>
            <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
              <Typography
                variant="subtitle2"
                ref={aiResponseHeadingRef}
                tabIndex={-1}
                sx={{ outline: "none" }}
              >
                AI Response
              </Typography>
              <Button
                size="small"
                onClick={() => setShowExpandedResponse(true)}
                disabled={!result || runStatus !== "success"}
              >
                Expand Response
              </Button>
            </Box>

            <Box
              role="region"
              aria-live="polite"
              aria-label="AI response output"
              tabIndex={0}
              sx={{
                minHeight: 200,
                maxHeight: "42vh",
                p: 1.5,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                bgcolor: "background.default",
                whiteSpace: "pre-wrap",
                lineHeight: 1.6,
                overflowY: "auto",
              }}
            >
              {runStatus === "loading" && "Running test..."}
              {runStatus === "error" && errorMessage}
              {runStatus === "success" && result}
            </Box>

            <Box>
              <Button
                size="small"
                onClick={() => setShowRenderedPrompt((prev) => !prev)}
                disabled={runStatus === "loading" || runStatus === "error" || !renderedPrompt}
              >
                {showRenderedPrompt ? "Hide rendered prompt" : "Show rendered prompt"}
              </Button>

              {showRenderedPrompt && renderedPrompt && (
                <Box mt={1}>
                  <Typography variant="subtitle2" gutterBottom>
                    Rendered Prompt
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      m: 0,
                      p: 1.5,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                      bgcolor: "background.default",
                      whiteSpace: "pre-wrap",
                      fontFamily: "monospace",
                      fontSize: "0.75rem",
                      lineHeight: 1.5,
                      maxHeight: 220,
                      overflowY: "auto",
                    }}
                  >
                    {renderedPrompt}
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Box>

      <Dialog
        open={showExpandedResponse}
        onClose={() => setShowExpandedResponse(false)}
        fullWidth
        maxWidth="lg"
        aria-labelledby="expanded-ai-response-title"
      >
        <DialogTitle id="expanded-ai-response-title" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box component="span" sx={{ flex: 1 }}>
            Expanded AI Response
          </Box>
          <IconButton
            onClick={() => setShowExpandedResponse(false)}
            aria-label="Close expanded response"
            edge="end"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box
            component="pre"
            sx={{
              m: 0,
              whiteSpace: "pre-wrap",
              fontFamily: "inherit",
              fontSize: "0.95rem",
              lineHeight: 1.6,
              minHeight: 300,
            }}
          >
            {result}
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
