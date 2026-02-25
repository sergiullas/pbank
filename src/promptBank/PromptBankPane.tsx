import { Box, Divider } from "@mui/material";
import { PromptDetail } from "./PromptDetail";
import { PromptHeader } from "./PromptHeader";
import { PromptList } from "./PromptList";

export function PromptBankPane() {
  return (
    <Box width={380} display="flex" flexDirection="column" minHeight={0} borderLeft={1} borderColor="divider">
      <PromptHeader />
      <Box flex={1} minHeight={0} overflow="auto">
        <PromptList />
      </Box>
      <Divider />
      <Box maxHeight="45%" overflow="auto">
        <PromptDetail />
      </Box>
    </Box>
  );
}
