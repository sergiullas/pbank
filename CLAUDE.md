# Prompt Bank — Claude Context

## What this app is

Prompt Bank is a React + TypeScript + Vite app for authoring, versioning, testing, and using AI prompts. No backend — all state lives in Zustand, persisted to localStorage.

Three surfaces:
- **Chat** — execution (insert prompt, send to mock AI)
- **Prompt Library** (`promptBank/`) — consumption: browse, search, favorite, insert published prompts
- **Prompt Manager** (`promptManager/`) — authoring: create, edit, test, version, publish, archive prompts

## Tech stack

- React 19 + TypeScript 5.9
- Zustand 5 (single store, `src/state/store.ts`)
- Material UI 7
- Vite 7

## Key files

| File | Purpose |
|------|---------|
| `src/types.ts` | All core types: `Prompt`, `PromptVersion`, `PromptStatus`, `FavoriteItem`, `Message` |
| `src/state/store.ts` | Zustand store — all state and actions |
| `src/state/persist.ts` | localStorage read/write helpers |
| `src/promptBank/versioning.ts` | Version resolution: `getLatestVersion`, `getPublishedVersion`, `getNextVersionNumber`, `resolveInitialLibraryVersion` |
| `src/promptBank/templateVariables.ts` | Token parsing (`[TOKEN]`, `[[TOKEN]]`, `[CONTEXT]`), substitution, validation |
| `src/promptManager/PromptEditor.tsx` | Main editor — draft/published/version-readonly/archived modes |
| `src/promptManager/PromptManagerList.tsx` | Manager landing: draft card strip + filterable list |
| `src/promptManager/promptManagerSelectors.ts` | Filter, sort, format helpers for the manager list |
| `src/promptBank/PromptBrowseView.tsx` | Library browse/search/filter/sort |
| `src/promptBank/PromptDetailView.tsx` | Library detail panel — version selector, inputs, insert |
| `src/promptManager/PromptTestPanel.tsx` | Test sandbox (uses current editor content, no version/lifecycle side effects) |
| `src/data/seedPrompts.ts` | 12 sample prompts with realistic version histories |
| `src/layout/AppShell.tsx` | Top-level layout: 3-col desktop, drawer-based mobile |

## Core data model

```ts
type PromptStatus = "draft" | "published" | "archived"

type Prompt = {
  id: string
  title: string
  description?: string
  desiredOutcome?: string        // "Prompt Instructions" in the UI
  category: string
  tags: string[]
  content: string                // working copy of the template
  likes: number
  createdAt: string
  owner: string
  media: boolean
  versions?: PromptVersion[]     // immutable snapshots, appended on publish
  status: PromptStatus
  archivedFromStatus?: Exclude<PromptStatus, "archived"> | null
  publishedVersionId?: string | null
  lastUpdatedAt?: string
  publishedAt?: string | null
  hasUnpublishedChanges?: boolean
}

type PromptVersion = {
  id: string          // "{promptId}-v{n}"
  version: number
  createdAt: string
  description?: string
  desiredOutcome?: string
  content: string
}
```

## Product rules (enforce these in all code)

1. **Lifecycle is prompt-level only.** States: `draft → published ↔ archived`. Versions have no lifecycle.
2. **Versions are immutable.** Never edit or delete a published version.
3. **One draft per prompt.** A prompt can have many versions but only one working draft state.
4. **`publishedVersionId` is the official pointer.** Latest version ≠ published version.
5. **Template = what gets sent. Prompt Instructions = how the AI should behave.**
6. **Testing uses current editor state.** No save required. No lifecycle effects.
7. **Library shows published prompts only.** `status !== "published"` → hidden from browse/search.
8. **Prompt Instructions do not appear in Prompt Library.** Manager-only.
9. **Favorites are version-specific.** `FavoriteItem` links to a `promptId` + `version` number.
10. **Archive removes from discovery, not from favorited access.** Existing favorited versions stay accessible. New favorites blocked while archived.

## Lifecycle actions (store.ts)

| Action | What it does |
|--------|-------------|
| `startNewPromptDraft()` | Creates new prompt with `status: "draft"`, empty versions |
| `savePromptDraft(id, payload)` | Saves working copy, no version created |
| `publishPrompt(id, payload)` | Creates immutable `PromptVersion`, sets `publishedVersionId`, clears `hasUnpublishedChanges` |
| `savePromptAsNewVersion(id, payload)` | Sets `status: "draft"`, copies base version content; one-draft rule enforced |
| `discardPromptDraft(id)` | If no `publishedVersionId` → delete prompt. If versions array → revert content from snapshot. If synthesized-v1 → restore status only |
| `deletePrompt(id)` | Hard delete; only works if `status === "draft"` |
| `archivePrompt(id)` | Sets `status: "archived"`, records `archivedFromStatus` |
| `restorePrompt(id)` | Restores `status` from `archivedFromStatus`, clears it |
| `unpublishPrompt(id)` | Exists in store but not exposed in current UI — not part of supported UX |

## Versioning

- `getNextVersionNumber(prompt)` — returns `1` if no versions array, else `max + 1`
- `getPublishedVersion(prompt)` — looks up `publishedVersionId` in `versions[]`; falls back to synthesized v1 if `publishedVersionId === "${id}-v1"` and no array
- `getLatestVersion(prompt)` — highest version number; synthesizes v1 from prompt fields if no array
- `resolveInitialLibraryVersion(prompt, favorites, explicit?)` — priority: explicit → version-specific favorite → published → null (caller falls back to latest)

**Synthesized-v1 pattern:** Some older/seed prompts have `publishedVersionId: "${id}-v1"` but no `versions` array. `getPublishedVersion` handles this by reading from `prompt.content/description/desiredOutcome`. All version utilities must account for this case.

## Token system

- `[TOKEN]` → single-line text input
- `[[TOKEN]]` → multi-line textarea input
- `[CONTEXT]` → file attachment
- `[[CONTEXT]]` → invalid (caught as error)
- `parseTemplateVariables(template)` → `{ variables, invalidTokens }`
- `substituteTemplateVariables(template, values, options)` → rendered string
- Mixed syntax for same token name → textarea wins

## Editor modes (`PromptEditor.tsx`)

| Mode | Condition | Footer |
|------|-----------|--------|
| `draft-edit` | `status === "draft"` | Save Draft, Delete Draft/Prompt, Publish |
| `published-readonly` | `status === "published"`, no viewingVersion | Create New Version |
| `version-readonly` | Viewing a historical version | Create New Version |
| `archived-readonly` | `status === "archived"` | Restore |

State separation is critical: `draftFormState` (local form) vs `viewingVersion` (historical read-only view). Switching historical versions while dirty triggers an unsaved-changes dialog.

## Snackbars/toasts

Use `setPromptManagerNotice(message)` only for explicit lifecycle and save actions:
- Draft saved / New version created / Prompt published / Prompt restored / Draft deleted / Prompt deleted

No toasts for test runs, field edits, or token validation.

## Known technical debt

- `desiredOutcome` is the internal field name for what the UI calls "Prompt Instructions." Keep UI copy as "Prompt Instructions"; the field name may stay internal.
- `unpublishPrompt` action exists in store but is not part of supported UX — no UI exposes it.
- Inline version list in the editor must always include the published version even if it falls outside the top-N most recent (not yet enforced — parking lot).
- Duplicate `PromptManagerStatusFilter` type defined in both `store.ts` and `promptManagerSelectors.ts` — minor drift risk.

## What NOT to do

- Do not show Prompt Instructions (`desiredOutcome`) in Prompt Library surfaces.
- Do not allow editing of published versions in place.
- Do not create a second draft state for a prompt that already has one.
- Do not delete a prompt that has a `publishedVersionId` — discard the draft instead.
- Do not add version-level lifecycle states (deprecated, archived, etc.) — these are future labels only.
- Do not add snackbars for test runs or field-level validation.
