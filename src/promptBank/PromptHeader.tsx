import { Box, Tab, Tabs, TextField, Typography } from "@mui/material";
import { useStore } from "../state/store";

export function PromptHeader() {
  const favorites = useStore((state) => state.favorites);
  const filterMode = useStore((state) => state.filterMode);
  const query = useStore((state) => state.promptQuery);
  const setPromptQuery = useStore((state) => state.setPromptQuery);
  const setFilterMode = useStore((state) => state.setFilterMode);

  const favoritesCount = favorites.length;
  const featuredCount = 0;

  return (
    <Box px={2} py={1.5} borderBottom={1} borderColor="divider">
      <Typography variant="h6" mb={1}>
        Prompt Library
      </Typography>

      <Tabs
        value={filterMode}
        onChange={(_, value: "all" | "favorites" | "featured") => setFilterMode(value)}
        aria-label="Prompt filter"
        sx={{ minHeight: 36, mb: 1.5 }}
      >
        <Tab value="all" label="All" sx={{ minHeight: 36 }} />
        <Tab value="favorites" label={`Favorites (${favoritesCount})`} sx={{ minHeight: 36 }} />
        <Tab value="featured" label={`Featured (${featuredCount})`} sx={{ minHeight: 36 }} />
      </Tabs>

      <TextField
        fullWidth
        size="small"
        placeholder="Search prompts…"
        value={query}
        onChange={(e) => setPromptQuery(e.target.value)}
      />
    </Box>
  );
}
