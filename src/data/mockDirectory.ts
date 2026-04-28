export type DirectoryUser = {
  id: string;
  name: string;
  email: string;
  tenantId: string;
  active: boolean;
};

export const CURRENT_USER_ID = "user-me";
export const CURRENT_TENANT_ID = "tenant-avengers";

export const mockDirectoryUsers: DirectoryUser[] = [
  { id: CURRENT_USER_ID, name: "You", email: "you@avengers.example", tenantId: CURRENT_TENANT_ID, active: true },
  { id: "user-natasha", name: "Natasha Romanoff", email: "natasha@avengers.example", tenantId: CURRENT_TENANT_ID, active: true },
  { id: "user-tony", name: "Tony Stark", email: "tony@avengers.example", tenantId: CURRENT_TENANT_ID, active: true },
  { id: "user-steve", name: "Steve Rogers", email: "steve@avengers.example", tenantId: CURRENT_TENANT_ID, active: true },
  { id: "user-bruce", name: "Bruce Banner", email: "bruce@avengers.example", tenantId: CURRENT_TENANT_ID, active: true },
  { id: "user-clint", name: "Clint Barton", email: "clint@avengers.example", tenantId: CURRENT_TENANT_ID, active: true },
  { id: "user-wanda", name: "Wanda Maximoff", email: "wanda@avengers.example", tenantId: CURRENT_TENANT_ID, active: true },
  { id: "user-vision", name: "Vision", email: "vision@avengers.example", tenantId: CURRENT_TENANT_ID, active: true },
  { id: "user-rhodes", name: "James Rhodes", email: "rhodes@avengers.example", tenantId: CURRENT_TENANT_ID, active: true },
  { id: "user-inactive", name: "Peter Parker", email: "peter@avengers.example", tenantId: CURRENT_TENANT_ID, active: false },
  { id: "user-external", name: "Nick Fury", email: "nick@shield.example", tenantId: "tenant-shield", active: true },
];

export const findDirectoryUserById = (userId: string): DirectoryUser | null => {
  return mockDirectoryUsers.find((user) => user.id === userId) ?? null;
};

export const searchDirectoryUsers = async (query: string): Promise<DirectoryUser[]> => {
  const normalized = query.trim().toLowerCase();
  if (normalized.length < 2) return [];

  await new Promise((resolve) => window.setTimeout(resolve, 150));

  return mockDirectoryUsers
    .filter((user) => user.active && user.tenantId === CURRENT_TENANT_ID && user.id !== CURRENT_USER_ID)
    .filter((user) => user.name.toLowerCase().includes(normalized) || user.email.toLowerCase().includes(normalized))
    .slice(0, 20);
};
