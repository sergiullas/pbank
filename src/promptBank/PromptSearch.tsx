import { TextField } from "@mui/material";
import { useStore } from "../state/store";

export function PromptSearch() {
  const query = useStore((state) => state.promptQuery);
  const setPromptQuery = useStore((state) => state.setPromptQuery);

  return (
    <TextField
      fullWidth
      size="small"
      placeholder="Search prompts…"
      value={query}
      onChange={(e) => setPromptQuery(e.target.value)}
    />
  );
}
