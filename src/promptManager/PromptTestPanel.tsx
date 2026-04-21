import CloseIcon from "@mui/icons-material/Close";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { extractTemplateVariables } from "../promptBank/templateVariables";
import { runPromptTest } from "./runPromptTest";

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
  const [error, setError] = useState<string | null>(null);

  const hasMissingVariables = nonContextVariables.some(
    (variable) => !(values[variable.token] ?? "").trim(),
  );
  const contextRequiredAndMissing = hasContextVariable && (!useContext || !file);
  const runDisabled = isRunning || hasMissingVariables || contextRequiredAndMissing;

  const handleRun = async () => {
    setIsRunning(true);
    setError(null);

    try {
      const testResult = await runPromptTest({
        template,
        variables: values,
        attachment: useContext ? file ?? undefined : undefined,
      });
      setRenderedPrompt(testResult.renderedPrompt);
      setResult(testResult.response);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to run prompt test.";
      setError(message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Box
      width={{ xs: "100%", lg: 420 }}
      borderLeft={1}
      borderColor="divider"
      bgcolor="background.paper"
      display="flex"
      flexDirection="column"
      minHeight={0}
    >
      <Box px={2} py={1.5} borderBottom={1} borderColor="divider" display="flex" alignItems="center" gap={1}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ flex: 1 }}>
          Test Prompt
        </Typography>
        <Button size="small" startIcon={<CloseIcon />} onClick={onClose}>
          Close
        </Button>
      </Box>

      <Box p={2} overflow="auto" minHeight={0}>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Run your prompt with sample inputs before publishing.
          </Typography>

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
            />
          ))}

          {hasContextVariable && (
            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={useContext}
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
                    onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  />
                </Button>
              )}
            </Stack>
          )}

          <Divider />

          <Button
            variant="contained"
            onClick={handleRun}
            disabled={runDisabled}
            startIcon={isRunning ? <CircularProgress color="inherit" size={16} /> : undefined}
          >
            {isRunning ? "Running..." : "Run Test"}
          </Button>

          {error && <Alert severity="error">{error}</Alert>}

          {renderedPrompt && (
            <Box>
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
                  whiteSpace: "pre-wrap",
                  fontFamily: "monospace",
                  fontSize: "0.75rem",
                }}
              >
                {renderedPrompt}
              </Box>
            </Box>
          )}

          {result && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                AI Response
              </Typography>
              <Box
                sx={{
                  p: 1.5,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  bgcolor: "background.default",
                  whiteSpace: "pre-wrap",
                }}
              >
                {result}
              </Box>
            </Box>
          )}
        </Stack>
      </Box>
    </Box>
  );
}
