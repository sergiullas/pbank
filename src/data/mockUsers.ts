export type MockUser = {
  id: string;
  name: string;
  email: string;
};

export const CURRENT_USER_ID = "current-user";

export const CURRENT_USER: MockUser = {
  id: CURRENT_USER_ID,
  name: "Alex Johnson",
  email: "alex.johnson@company.com",
};

export const MOCK_USERS: MockUser[] = [
  { id: "user-01", name: "Maria Chen", email: "maria.chen@company.com" },
  { id: "user-02", name: "James Okafor", email: "james.okafor@company.com" },
  { id: "user-03", name: "Priya Sharma", email: "priya.sharma@company.com" },
  { id: "user-04", name: "Daniel Torres", email: "daniel.torres@company.com" },
  { id: "user-05", name: "Sofia Lindqvist", email: "sofia.lindqvist@company.com" },
  { id: "user-06", name: "Kenji Nakamura", email: "kenji.nakamura@company.com" },
  { id: "user-07", name: "Amara Diallo", email: "amara.diallo@company.com" },
  { id: "user-08", name: "Lucas Ferreira", email: "lucas.ferreira@company.com" },
  { id: "user-09", name: "Ingrid Haugen", email: "ingrid.haugen@company.com" },
  { id: "user-10", name: "Omar Al-Rashid", email: "omar.alrashid@company.com" },
  { id: "user-11", name: "Yuki Tanaka", email: "yuki.tanaka@company.com" },
  { id: "user-12", name: "Fatima Malik", email: "fatima.malik@company.com" },
  { id: "user-13", name: "Carlos Mendoza", email: "carlos.mendoza@company.com" },
  { id: "user-14", name: "Hana Kovacevic", email: "hana.kovacevic@company.com" },
  { id: "user-15", name: "Ethan Williams", email: "ethan.williams@company.com" },
  { id: "user-16", name: "Nia Osei", email: "nia.osei@company.com" },
  { id: "user-17", name: "Ravi Patel", email: "ravi.patel@company.com" },
  { id: "user-18", name: "Emma Bergstrom", email: "emma.bergstrom@company.com" },
  { id: "user-19", name: "Liam O'Brien", email: "liam.obrien@company.com" },
  { id: "user-20", name: "Zara Ahmed", email: "zara.ahmed@company.com" },
  { id: "user-21", name: "Noah Kim", email: "noah.kim@company.com" },
  { id: "user-22", name: "Isabella Rossi", email: "isabella.rossi@company.com" },
  { id: "user-23", name: "Finn Larsen", email: "finn.larsen@company.com" },
  { id: "user-24", name: "Chidi Eze", email: "chidi.eze@company.com" },
  { id: "user-25", name: "Mei-Lin Zhou", email: "meilin.zhou@company.com" },
];

export const searchMockUsers = (query: string): Promise<MockUser[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const normalized = query.trim().toLowerCase();
      if (!normalized) {
        resolve([]);
        return;
      }
      const results = MOCK_USERS.filter(
        (u) =>
          u.name.toLowerCase().includes(normalized) ||
          u.email.toLowerCase().includes(normalized),
      );
      resolve(results);
    }, 300);
  });
};
