import AddIcon from "@mui/icons-material/Add";
import PersonIcon from "@mui/icons-material/Person";
import RemoveIcon from "@mui/icons-material/Remove";
import SearchIcon from "@mui/icons-material/Search";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { CURRENT_USER, MOCK_USERS, searchMockUsers } from "../data/mockUsers";
import type { MockUser } from "../data/mockUsers";
import type { SharedWith } from "../types";

type SharedWithModalProps = {
  open: boolean;
  sharedWith: SharedWith;
  ownerName: string;
  onSave: (next: SharedWith) => void;
  onClose: () => void;
};

export function SharedWithModal({ open, sharedWith, ownerName, onSave, onClose }: SharedWithModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MockUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [localUsers, setLocalUsers] = useState<string[]>(sharedWith.users);

  useEffect(() => {
    if (open) {
      setLocalUsers(sharedWith.users);
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [open, sharedWith.users]);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(() => {
      searchMockUsers(trimmed).then((results) => {
        setSearchResults(results.filter((u) => u.id !== CURRENT_USER.id));
        setIsSearching(false);
      });
    }, 0);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const addUser = (userId: string) => {
    if (!localUsers.includes(userId)) {
      setLocalUsers((prev) => [...prev, userId]);
    }
  };

  const removeUser = (userId: string) => {
    setLocalUsers((prev) => prev.filter((id) => id !== userId));
  };

  const handleSave = () => {
    onSave({ users: localUsers, groups: sharedWith.groups });
  };

  const sharedUserObjects = localUsers
    .map((id) => MOCK_USERS.find((u) => u.id === id))
    .filter((u): u is MockUser => Boolean(u));

  const getInitials = (name: string) =>
    name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="shared-with-dialog-title"
    >
      <DialogTitle id="shared-with-dialog-title">Manage Access</DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        <Box px={3} pt={2} pb={1}>
          <Typography variant="subtitle2" color="text.secondary" mb={1.5}>
            Shared with
          </Typography>

          <List disablePadding>
            {/* Creator — always shown, non-removable */}
            <ListItem
              disablePadding
              sx={{ py: 0.75 }}
              secondaryAction={
                <Chip label="Owner" size="small" variant="outlined" />
              }
            >
              <ListItemAvatar sx={{ minWidth: 44 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: "0.75rem" }}>
                  {getInitials(ownerName)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={ownerName}
                secondary={CURRENT_USER.email}
                primaryTypographyProps={{ variant: "body2", fontWeight: 600 }}
                secondaryTypographyProps={{ variant: "caption" }}
              />
            </ListItem>

            {sharedUserObjects.length === 0 ? (
              <ListItem disablePadding sx={{ py: 1 }}>
                <ListItemText
                  primary="No one else has access yet."
                  primaryTypographyProps={{ variant: "body2", color: "text.secondary" }}
                />
              </ListItem>
            ) : (
              sharedUserObjects.map((user) => (
                <ListItem
                  key={user.id}
                  disablePadding
                  sx={{ py: 0.75 }}
                  secondaryAction={
                    <Tooltip title={`Remove ${user.name}`}>
                      <IconButton
                        size="small"
                        onClick={() => removeUser(user.id)}
                        aria-label={`Remove ${user.name} from shared access`}
                        edge="end"
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  }
                >
                  <ListItemAvatar sx={{ minWidth: 44 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: "secondary.main", fontSize: "0.75rem" }}>
                      {getInitials(user.name)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={user.name}
                    secondary={user.email}
                    primaryTypographyProps={{ variant: "body2" }}
                    secondaryTypographyProps={{ variant: "caption" }}
                  />
                </ListItem>
              ))
            )}
          </List>
        </Box>

        <Divider />

        <Box px={3} pt={2} pb={2}>
          <Typography variant="subtitle2" color="text.secondary" mb={1.5}>
            Add people
          </Typography>

          <TextField
            fullWidth
            size="small"
            placeholder="Search by name or email…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            inputProps={{ "aria-label": "Search people to share with" }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {isSearching ? (
                    <CircularProgress size={16} />
                  ) : (
                    <SearchIcon fontSize="small" color="action" />
                  )}
                </InputAdornment>
              ),
            }}
            autoComplete="off"
          />

          {searchResults.length > 0 && (
            <List disablePadding sx={{ mt: 1 }}>
              {searchResults.map((user) => {
                const alreadyAdded = localUsers.includes(user.id);
                return (
                  <ListItem
                    key={user.id}
                    disablePadding
                    sx={{ py: 0.5 }}
                    secondaryAction={
                      alreadyAdded ? (
                        <Chip label="Added" size="small" color="success" variant="outlined" />
                      ) : (
                        <Tooltip title={`Add ${user.name}`}>
                          <IconButton
                            size="small"
                            onClick={() => addUser(user.id)}
                            aria-label={`Add ${user.name} to shared access`}
                            edge="end"
                            color="primary"
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )
                    }
                  >
                    <ListItemAvatar sx={{ minWidth: 44 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: "action.selected", color: "text.secondary", fontSize: "0.75rem" }}>
                        <PersonIcon fontSize="small" />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={user.name}
                      secondary={user.email}
                      primaryTypographyProps={{ variant: "body2" }}
                      secondaryTypographyProps={{ variant: "caption" }}
                    />
                  </ListItem>
                );
              })}
            </List>
          )}

          {searchQuery.trim() && !isSearching && searchResults.length === 0 && (
            <Stack alignItems="center" py={2}>
              <Typography variant="body2" color="text.secondary">
                No people found matching "{searchQuery.trim()}".
              </Typography>
            </Stack>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
