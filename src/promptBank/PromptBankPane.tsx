import { Box } from "@mui/material";
import { useStore } from "../state/store";
import { PromptBrowseView } from "./PromptBrowseView";
import { PromptDetailView } from "./PromptDetailView";

export function PromptBankPane() {
  const libraryView = useStore((state) => state.libraryView);

  return (
    <Box width={380} display="flex" flexDirection="column" minHeight={0} borderLeft={1} borderColor="divider">
      <Box display={libraryView === "browse" ? "block" : "none"} flex={1} minHeight={0}>
        <PromptBrowseView />
      </Box>
      <Box display={libraryView === "detail" ? "block" : "none"} flex={1} minHeight={0}>
        <PromptDetailView />
      </Box>
    </Box>
  );
}
