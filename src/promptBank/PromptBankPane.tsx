import { Box, Divider, Typography } from "@mui/material";
import { PromptDetail } from "./PromptDetail";
import { PromptList } from "./PromptList";
import { PromptSearch } from "./PromptSearch";

export function PromptBankPane() {
  return (
    <Box width={380} display="flex" flexDirection="column" minHeight={0}>
      <Box px={2} py={1.5} borderBottom={1} borderColor="divider">
        <Typography variant="h6">Prompt Library</Typography>
      </Box>
      <Box p={2}>
        <PromptSearch />
      </Box>
      <Divider />
      <Box flex={1} minHeight={0} overflow="auto">
        <PromptList />
      </Box>
      <Divider />
      <Box maxHeight="42%" overflow="auto">
        <PromptDetail />
      </Box>
    </Box>
  );
}
