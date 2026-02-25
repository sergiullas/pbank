import { Box } from "@mui/material";
import { useStore } from "../state/store";
import { PromptBrowseView } from "./PromptBrowseView";
import { PromptDetailView } from "./PromptDetailView";

export function PromptBankPane() {
  const libraryView = useStore((state) => state.libraryView);

  return (
    <Box width={380} display="flex" flexDirection="column" minHeight={0} borderLeft={1} borderColor="divider">
      <Box flex={1} minHeight={0}>
        {libraryView === "browse" ? <PromptBrowseView /> : <PromptDetailView />}
      </Box>
    </Box>
  );
}
