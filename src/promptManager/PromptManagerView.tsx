import { Alert, Box, Snackbar, Typography } from "@mui/material";
import { useMemo } from "react";
import { useStore } from "../state/store";
import { PromptManagerList } from "./PromptManagerList";
import { PromptEditor } from "./PromptEditor";

export function PromptManagerView() {
  const promptManagerView = useStore((state) => state.promptManagerView);
  const selectedManagedPromptId = useStore((state) => state.selectedManagedPromptId);
  const prompts = useStore((state) => state.prompts);
  const setPromptManagerView = useStore((state) => state.selectManagedPrompt);
  const promptManagerNotice = useStore((state) => state.promptManagerNotice);
  const setPromptManagerNotice = useStore((state) => state.setPromptManagerNotice);

  const selectedPrompt = useMemo(
    () => (selectedManagedPromptId ? prompts.find((p) => p.id === selectedManagedPromptId) ?? null : null),
    [prompts, selectedManagedPromptId],
  );

  const handleBack = () => {
    setPromptManagerView(null);
  };

  return (
    <Box display="flex" flexDirection="column" height="100%" minHeight={0} overflow="hidden">
      {promptManagerView === "editor" && selectedPrompt ? (
        <PromptEditor
          key={`${selectedPrompt.id}:${selectedPrompt.status}:${selectedPrompt.lastUpdatedAt ?? "na"}`}
          prompt={selectedPrompt}
          onBack={handleBack}
        />
      ) : promptManagerView === "editor" && !selectedPrompt ? (
        // Edge case: editor requested but prompt not found
        <Box p={4} display="flex" flexDirection="column" gap={1}>
          <Typography variant="h6" color="text.secondary">Prompt not found</Typography>
          <Typography variant="body2" color="text.secondary">
            The prompt you were editing could not be found.
          </Typography>
        </Box>
      ) : (
        <PromptManagerList />
      )}
      <Snackbar
        open={Boolean(promptManagerNotice)}
        autoHideDuration={3000}
        onClose={() => setPromptManagerNotice(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setPromptManagerNotice(null)} severity="success" variant="filled" sx={{ width: "100%" }}>
          {promptManagerNotice}
        </Alert>
      </Snackbar>
    </Box>
  );
}
