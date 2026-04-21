import CloseIcon from "@mui/icons-material/Close";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { extractTemplateVariables } from "../promptBank/templateVariables";
import { renderPromptTestTemplate, runPromptTest } from "./runPromptTest";

interface PromptTestPanelProps {
  template: string;
  onClose: () => void;
}

export function PromptTestPanel({ template, onClose }: PromptTestPanelProps) {
  const variables = useMemo(() => extractTemplateVariables(template), [template]);
  const hasContextVariable = variables.some((variable) => variable.isContext);
  const nonContextVariables = variables.filter((variable) => !variable.isContext);

  const [values, setValues] = useState<Record<string, string>>({});
  const [useContext, setUseContext] = useState(hasContextVariable);
  const [file, setFile] = useState<File | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [renderedPrompt, setRenderedPrompt] = useState<string | null>(null);
  const [showRenderedPrompt, setShowRenderedPrompt] = useState(false);
  const [showAiResponse, setShowAiResponse] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const multilineTokenPattern = /(DESCRIPTION|SUMMARY|NOTES|INPUT_TEXT|BODY)/i;
  const hasMissingVariables = nonContextVariables.some(
    (variable) => !(values[variable.token] ?? "").trim(),
  );
  const contextRequiredAndMissing = hasContextVariable && (!useContext || !file);
  const runDisabled = isRunning || hasMissingVariables || contextRequiredAndMissing;

  const handleRun = async () => {
    setIsRunning(true);
    setError(null);

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
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to run prompt test.";
      setError(message);
    } finally {
      setIsRunning(false);
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

      <Box
        p={2}
        flex={1}
        minHeight={0}
        display="flex"
        flexDirection="column"
        gap={2}
        sx={{ overflowY: "auto" }}
      >
        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            Run your prompt with sample inputs before publishing.
          </Typography>
        </Stack>

        <Box
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            p: 1.25,
            minHeight: 0,
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
              required
              disabled={isRunning}
              multiline={multilineTokenPattern.test(variable.token)}
              minRows={multilineTokenPattern.test(variable.token) ? 2 : 1}
              maxRows={multilineTokenPattern.test(variable.token) ? 8 : 1}
              sx={multilineTokenPattern.test(variable.token) ? {
                "& .MuiInputBase-inputMultiline": {
                  maxHeight: "22vh",
                  overflowY: "auto !important",
                  resize: "none",
                },
              } : undefined}
            />
          ))}

          {hasContextVariable && (
            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={useContext}
                    disabled={isRunning}
                    onChange={(event) => {
                      setUseContext(event.target.checked);
                      if (!event.target.checked) setFile(null);
                    }}
                  />
                }
                label="Use attached file as context"
              />

              {useContext && (
                <Button variant="outlined" component="label">
                  {file ? `Selected: ${file.name}` : "Attach file"}
                  <input
                    type="file"
                    hidden
                    disabled={isRunning}
                    onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  />
                </Button>
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
          startIcon={isRunning ? <CircularProgress color="inherit" size={16} /> : undefined}
        >
          {isRunning ? "Running..." : "Run Test"}
        </Button>

        {error && <Alert severity="error">{error}</Alert>}

        <Divider />

        <Accordion
          disableGutters
          expanded={showRenderedPrompt}
          onChange={(_, expanded) => setShowRenderedPrompt(expanded)}
          elevation={0}
          sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}
        >
          <AccordionSummary
            expandIcon={showRenderedPrompt ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ minHeight: 44 }}
          >
            <Typography variant="subtitle2">Rendered Prompt</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <Box
              component="pre"
              sx={{
                m: 0,
                p: 1.5,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                whiteSpace: "pre-wrap",
                fontFamily: "monospace",
                fontSize: "0.75rem",
                maxHeight: 200,
                overflowY: "auto",
              }}
            >
              {renderedPrompt ?? "Run a test to preview rendered prompt."}
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion
          disableGutters
          expanded={showAiResponse}
          onChange={(_, expanded) => setShowAiResponse(expanded)}
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            minHeight: showAiResponse ? 220 : "auto",
            flex: showAiResponse ? 1 : 0,
            overflow: "hidden",
          }}
        >
          <AccordionSummary
            expandIcon={showAiResponse ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ minHeight: 44 }}
          >
            <Typography variant="subtitle2">AI Response</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0, height: "100%", minHeight: 0 }}>
            <Box
              sx={{
                p: 1.5,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                bgcolor: "background.default",
                whiteSpace: "pre-wrap",
                overflowY: "auto",
                minHeight: 200,
                maxHeight: "100%",
              }}
            >
              {isRunning ? "Running..." : result ?? "Run a test to see results"}
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Box>
  );
}
