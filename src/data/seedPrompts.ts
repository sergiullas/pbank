import type { Prompt } from "../types";

export const seedPrompts: Prompt[] = [
  {
    id: "structured-summary",
    title: "Structured Summary",
    description: "Summarize with bullets, key takeaways, and open questions.",
    desiredOutcome: "Capture the essential points quickly so stakeholders can align on what matters, what is decided, and what still needs follow-up.",
    category: "Summarization",
    tags: ["summary", "bullets", "takeaways"],
    content:
      `Summarize the following content. Provide:
1) 5 bullet highlights
2) 3 key takeaways
3) 2 open questions for follow-up

Content:
[PASTE CONTENT]`,
    versions: [
      {
        id: "structured-summary-v1",
        version: 1,
        createdAt: "2026-02-19T12:00:00.000Z",
        description: "Summarize the source material into concise highlights.",
        desiredOutcome: "Get a quick understanding of key points from the provided content.",
        content: `Summarize the following content into 5 bullet highlights.

Content:
[PASTE CONTENT]`,
      },
      {
        id: "structured-summary-v2",
        version: 2,
        createdAt: "2026-03-02T12:00:00.000Z",
        description: "Summarize with highlights and clear takeaways.",
        desiredOutcome: "Provide a digest that helps stakeholders understand what matters most and what to do next.",
        content:
          `Summarize the following content. Provide:
1) 5 bullet highlights
2) 3 key takeaways

Content:
[PASTE CONTENT]`,
      },
      {
        id: "structured-summary-v3",
        version: 3,
        createdAt: "2026-03-14T12:00:00.000Z",
        description: "Summarize with bullets, key takeaways, and open questions.",
        desiredOutcome: "Capture the essential points quickly so stakeholders can align on what matters, what is decided, and what still needs follow-up.",
        content:
          `Summarize the following content. Provide:
1) 5 bullet highlights
2) 3 key takeaways
3) 2 open questions for follow-up

Content:
[PASTE CONTENT]`,
      },
    ],
    createdAt: "2026-02-19T12:00:00.000Z",
    lastUpdatedAt: "2026-03-14T12:00:00.000Z",
    owner: "Natasha Romanoff (Black Widow)",
    media: false,
    likes: 3456,
    status: "published",
    publishedVersionId: "structured-summary-v3",
    publishedAt: "2026-03-14T12:00:00.000Z",
    hasUnpublishedChanges: false,
  },
  {
    id: "email-draft",
    title: "Email Draft",
    description: "Draft a polished email tailored to audience and tone.",
    desiredOutcome: "Produce an email that is immediately sendable, with clear intent, the right tone, and a concrete next step for the recipient.",
    category: "Email",
    tags: ["email", "communication", "tone"],
    content:
      "Draft an email with:\n- Subject line\n- Greeting\n- Body in a [TONE] tone\n- Clear call-to-action\n\nAudience: [AUDIENCE]\nGoal: [GOAL]\nDetails: [DETAILS]",
    createdAt: "2026-01-27T12:00:00.000Z",
    lastUpdatedAt: "2026-01-27T12:00:00.000Z",
    owner: "Tony Stark (Iron Man)",
    media: false,
    likes: 1234,
    status: "published",
    publishedVersionId: "email-draft-v1",
    publishedAt: "2026-01-27T12:00:00.000Z",
    hasUnpublishedChanges: false,
  },
  {
    id: "strategy-framework",
    title: "Strategy Framework",
    description: "Outline a strategy using a structured framework.",
    desiredOutcome: "Arrive at a defendable recommendation with explicit trade-offs and a practical first-action plan.",
    category: "Planning",
    tags: ["strategy", "decision", "planning"],
    content:
      "Use this framework:\n- Goal\n- Constraints\n- Options (with trade-offs)\n- Recommendation\n- Next 3 actions",
    createdAt: "2026-02-25T12:00:00.000Z",
    lastUpdatedAt: "2026-02-25T12:00:00.000Z",
    owner: "Steve Rogers (Captain America)",
    media: false,
    likes: 4567,
    status: "published",
    publishedVersionId: "strategy-framework-v1",
    publishedAt: "2026-02-25T12:00:00.000Z",
    hasUnpublishedChanges: false,
  },
  {
    id: "pros-cons-decision",
    title: "Pros/Cons Decision",
    description: "Evaluate options using weighted criteria for decision making.",
    desiredOutcome: "Select the strongest option transparently by comparing alternatives against weighted criteria and clear rationale.",
    category: "Analysis",
    tags: ["pros", "cons", "weighted", "decision"],
    content:
      "Evaluate options using weighted criteria.\n\nOptions: [OPTIONS]\nCriteria + weights: [CRITERIA]\n\nOutput:\n1) Score table\n2) Pros/cons by option\n3) Final recommendation with rationale",
    createdAt: "2025-11-01T12:00:00.000Z",
    lastUpdatedAt: "2025-11-01T12:00:00.000Z",
    owner: "Bruce Banner (Hulk)",
    media: false,
    likes: 2345,
    status: "draft",
    publishedVersionId: null,
    hasUnpublishedChanges: false,
  },
  {
    id: "meeting-notes",
    title: "Meeting Notes",
    description: "Convert meeting transcripts into concise notes with action items.",
    desiredOutcome: "Turn raw discussion into actionable notes that clarify decisions, owners, timelines, and unresolved blockers.",
    category: "Writing",
    tags: ["meeting", "notes", "actions"],
    content:
      "Convert transcript into concise meeting notes:\n- Agenda\n- Decisions made\n- Action items with owners and due dates\n- Risks/blockers\n\nTranscript:\n[TRANSCRIPT]",
    createdAt: "2026-02-19T12:00:00.000Z",
    lastUpdatedAt: "2026-02-19T12:00:00.000Z",
    owner: "Clint Barton (Hawkeye)",
    media: false,
    likes: 3123,
    status: "published",
    publishedVersionId: "meeting-notes-v1",
    publishedAt: "2026-02-19T12:00:00.000Z",
    hasUnpublishedChanges: false,
  },
  {
    id: "rewrite-clarity",
    title: "Rewrite for Clarity",
    description: "Rewrite text to improve clarity, adjust reading level, and reduce length.",
    desiredOutcome: "Deliver a shorter, clearer version of the source text that preserves meaning and is easier for the target audience to read.",
    category: "Writing",
    tags: ["rewrite", "clarity", "editing"],
    content:
      "Rewrite the text for clarity.\nRequirements:\n- Target reading level: [LEVEL]\n- Remove jargon\n- Shorten by [PERCENT]%\n- Keep original meaning\n\nText:\n[TEXT]",
    createdAt: "2026-02-25T12:00:00.000Z",
    lastUpdatedAt: "2026-02-25T12:00:00.000Z",
    owner: "Wanda Maximoff (Scarlet Witch)",
    media: false,
    likes: 1890,
    status: "draft",
    publishedVersionId: null,
    hasUnpublishedChanges: false,
  },
  {
    id: "root-cause-analysis",
    title: "Root Cause Analysis",
    description: "Perform a '5 Whys' analysis to identify the root cause of a problem.",
    desiredOutcome: "Identify the true underlying cause of the problem and define corrective and preventive actions that reduce recurrence.",
    category: "Analysis",
    tags: ["5 whys", "root cause", "problem"],
    content:
      "Perform a 5 Whys root cause analysis for:\n[PROBLEM]\n\nOutput:\n- Why #1 to #5\n- Root cause statement\n- Corrective actions\n- Preventive actions",
    createdAt: "2026-01-27T12:00:00.000Z",
    lastUpdatedAt: "2026-01-27T12:00:00.000Z",
    owner: "Vision",
    media: false,
    likes: 4100,
    status: "published",
    publishedVersionId: "root-cause-analysis-v1",
    publishedAt: "2026-01-27T12:00:00.000Z",
    hasUnpublishedChanges: false,
  },
  {
    id: "prd-draft",
    title: "Product Requirements Draft",
    description: "Draft a Product Requirements Document (PRD) with key sections.",
    category: "Planning",
    tags: ["product", "requirements", "prd"],
    content:
      "Draft a PRD with sections:\n- Problem\n- Users\n- Scope\n- Non-goals\n- Success metrics\n- Risks",
    createdAt: "2025-11-01T12:00:00.000Z",
    lastUpdatedAt: "2025-11-01T12:00:00.000Z",
    owner: "Sam Wilson (Falcon)",
    media: false,
    likes: 2750,
    status: "archived",
    publishedVersionId: null,
    hasUnpublishedChanges: false,
  },
  {
    id: "user-research-plan",
    title: "User Research Plan",
    description: "Create a plan for user research, including objectives, methods, and participant criteria.",
    desiredOutcome: "Create a practical and execution-ready plan for user research that aligns goals, methods, participants, and analysis.",
    category: "Planning",
    tags: ["research", "users", "interviews"],
    content:
      "Create a user research plan with:\n- Objectives\n- Methods\n- Participant criteria\n- Discussion guide\n- Timeline\n- Analysis approach\n\nProduct area:\n[PRODUCT AREA]",
    versions: [
      {
        id: "user-research-plan-v1",
        version: 1,
        createdAt: "2026-01-05T12:00:00.000Z",
        description: "Initial research plan structure.",
        desiredOutcome: "Get a basic research plan drafted quickly.",
        content:
          "Create a user research plan with:\n- Objectives\n- Methods\n- Participant criteria\n\nProduct area:\n[PRODUCT AREA]",
      },
      {
        id: "user-research-plan-v2",
        version: 2,
        createdAt: "2026-01-20T12:00:00.000Z",
        description: "Added discussion guide expectations.",
        desiredOutcome: "Ensure interviews are consistent and actionable.",
        content:
          "Create a user research plan with:\n- Objectives\n- Methods\n- Participant criteria\n- Discussion guide\n\nProduct area:\n[PRODUCT AREA]",
      },
      {
        id: "user-research-plan-v3",
        version: 3,
        createdAt: "2026-02-02T12:00:00.000Z",
        description: "Added timeline and analysis approach.",
        desiredOutcome: "Improve planning realism and synthesis quality.",
        content:
          "Create a user research plan with:\n- Objectives\n- Methods\n- Participant criteria\n- Discussion guide\n- Timeline\n- Analysis approach\n\nProduct area:\n[PRODUCT AREA]",
      },
      {
        id: "user-research-plan-v4",
        version: 4,
        createdAt: "2026-02-16T12:00:00.000Z",
        description: "Clarified constraints and risks section.",
        desiredOutcome: "Surface practical risks before execution starts.",
        content:
          "Create a user research plan with:\n- Objectives\n- Methods\n- Participant criteria\n- Discussion guide\n- Timeline\n- Analysis approach\n- Risks and constraints\n\nProduct area:\n[PRODUCT AREA]",
      },
      {
        id: "user-research-plan-v5",
        version: 5,
        createdAt: "2026-03-03T12:00:00.000Z",
        description: "Improved participant criteria and screening specificity.",
        desiredOutcome: "Recruit participants that match research goals.",
        content:
          "Create a user research plan with:\n- Objectives\n- Methods\n- Participant criteria + screener notes\n- Discussion guide\n- Timeline\n- Analysis approach\n- Risks and constraints\n\nProduct area:\n[PRODUCT AREA]",
      },
      {
        id: "user-research-plan-v6",
        version: 6,
        createdAt: "2026-03-25T12:00:00.000Z",
        description: "Current version with analysis outputs and decision criteria.",
        desiredOutcome: "Create a practical and execution-ready plan for user research that aligns goals, methods, participants, and analysis.",
        content:
          "Create a user research plan with:\n- Objectives\n- Methods\n- Participant criteria + screener notes\n- Discussion guide\n- Timeline\n- Analysis approach\n- Risks and constraints\n- Decision criteria for recommendations\n\nProduct area:\n[PRODUCT AREA]",
      },
    ],
    createdAt: "2026-02-19T12:00:00.000Z",
    lastUpdatedAt: "2026-03-25T12:00:00.000Z",
    owner: "James Rhodes (War Machine)",
    media: false,
    likes: 3800,
    status: "published",
    publishedVersionId: "user-research-plan-v6",
    publishedAt: "2026-03-25T12:00:00.000Z",
    hasUnpublishedChanges: false,
  },
  {
    id: "ux-critique-checklist",
    title: "UX Critique Checklist",
    description: "Critique an interface using usability heuristics and accessibility checks.",
    category: "Analysis",
    tags: ["ux", "heuristics", "accessibility"],
    content:
      "Critique this interface using:\n- Usability heuristics\n- Accessibility checks\n- Content clarity\n\nProvide:\n1) Findings\n2) Severity\n3) Suggested fixes\n\nInterface details:\n[DETAILS]",
    createdAt: "2026-02-25T12:00:00.000Z",
    lastUpdatedAt: "2026-02-25T12:00:00.000Z",
    owner: "Scott Lang (Ant-Man)",
    media: true,
    likes: 1500,
    status: "draft",
    publishedVersionId: null,
    hasUnpublishedChanges: false,
  },
  {
    id: "feature-brief",
    title: "Feature Brief",
    description: "Write a one-page brief for a feature, including problem statement, user value, and solution.",
    desiredOutcome: "Produce a stakeholder-ready brief that clearly explains the problem, value, scope, and launch considerations.",
    category: "Writing",
    tags: ["feature", "brief", "stakeholders"],
    content:
      `Write a one-page feature brief including:
- Problem statement
- User value
- Proposed solution
- Dependencies
- Launch risks

Inputs:
[INPUTS]`,
    versions: [
      {
        id: "feature-brief-v1",
        version: 1,
        createdAt: "2026-01-27T12:00:00.000Z",
        description: "Draft a short feature brief with problem and solution.",
        desiredOutcome: "Create a basic brief that introduces the feature and rationale.",
        content:
          `Draft a feature brief with:
- Problem statement
- Proposed solution

Inputs:
[INPUTS]`,
      },
      {
        id: "feature-brief-v2",
        version: 2,
        createdAt: "2026-02-15T12:00:00.000Z",
        description: "Write a feature brief with user value and dependencies.",
        desiredOutcome: "Help cross-functional teams understand user impact and implementation needs.",
        content:
          `Write a one-page feature brief including:
- Problem statement
- User value
- Proposed solution
- Dependencies

Inputs:
[INPUTS]`,
      },
      {
        id: "feature-brief-v3",
        version: 3,
        createdAt: "2026-03-10T12:00:00.000Z",
        description: "Write a one-page brief for a feature, including problem statement, user value, and solution.",
        desiredOutcome: "Produce a stakeholder-ready brief that clearly explains the problem, value, scope, and launch considerations.",
        content:
          `Write a one-page feature brief including:
- Problem statement
- User value
- Proposed solution
- Dependencies
- Launch risks

Inputs:
[INPUTS]`,
      },
    ],
    createdAt: "2026-01-27T12:00:00.000Z",
    lastUpdatedAt: "2026-03-10T12:00:00.000Z",
    owner: "Carol Danvers (Captain Marvel)",
    media: false,
    likes: 4900,
    status: "published",
    publishedVersionId: "feature-brief-v3",
    publishedAt: "2026-03-10T12:00:00.000Z",
    hasUnpublishedChanges: false,
  },
  {
    id: "competitive-scan",
    title: "Competitive Scan",
    description: "Analyze competitors' offerings, strengths, weaknesses, and pricing.",
    category: "Analysis",
    tags: ["competition", "benchmark", "market"],
    content:
      "Analyze competitors for:\n- Core offerings\n- Strengths/weaknesses\n- Pricing model\n- Differentiation opportunities\n\nTarget segment:\n[SEGMENT]",
    createdAt: "2025-11-01T12:00:00.000Z",
    lastUpdatedAt: "2025-11-01T12:00:00.000Z",
    owner: "Guardians of the Galaxy",
    media: false,
    likes: 2999,
    status: "published",
    publishedVersionId: "competitive-scan-v1",
    publishedAt: "2025-11-01T12:00:00.000Z",
    hasUnpublishedChanges: false,
  },
];
