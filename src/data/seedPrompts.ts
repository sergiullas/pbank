import type { Prompt } from "../types";

export const seedPrompts: Prompt[] = [
  {
    id: "structured-summary",
    title: "Structured Summary",
    description: "Summarize with bullets, key takeaways, and open questions.",
    category: "Summarization",
    tags: ["summary", "bullets", "takeaways"],
    content:
      "Summarize the following content. Provide:\n1) 5 bullet highlights\n2) 3 key takeaways\n3) 2 open questions for follow-up\n\nContent:\n[PASTE CONTENT]",
  },
  {
    id: "email-draft",
    title: "Email Draft",
    description: "Draft a polished email tailored to audience and tone.",
    category: "Email",
    tags: ["email", "communication", "tone"],
    content:
      "Draft an email with:\n- Subject line\n- Greeting\n- Body in a [TONE] tone\n- Clear call-to-action\n\nAudience: [AUDIENCE]\nGoal: [GOAL]\nDetails: [DETAILS]",
  },
  {
    id: "strategy-framework",
    title: "Strategy Framework",
    category: "Planning",
    tags: ["strategy", "decision", "planning"],
    content:
      "Use this framework:\n- Goal\n- Constraints\n- Options (with trade-offs)\n- Recommendation\n- Next 3 actions\n\nContext:\n[CONTEXT]",
  },
  {
    id: "pros-cons-decision",
    title: "Pros/Cons Decision",
    category: "Analysis",
    tags: ["pros", "cons", "weighted", "decision"],
    content:
      "Evaluate options using weighted criteria.\n\nOptions: [OPTIONS]\nCriteria + weights: [CRITERIA]\n\nOutput:\n1) Score table\n2) Pros/cons by option\n3) Final recommendation with rationale",
  },
  {
    id: "meeting-notes",
    title: "Meeting Notes",
    category: "Writing",
    tags: ["meeting", "notes", "actions"],
    content:
      "Convert transcript into concise meeting notes:\n- Agenda\n- Decisions made\n- Action items with owners and due dates\n- Risks/blockers\n\nTranscript:\n[TRANSCRIPT]",
  },
  {
    id: "rewrite-clarity",
    title: "Rewrite for Clarity",
    category: "Writing",
    tags: ["rewrite", "clarity", "editing"],
    content:
      "Rewrite the text for clarity.\nRequirements:\n- Target reading level: [LEVEL]\n- Remove jargon\n- Shorten by [PERCENT]%\n- Keep original meaning\n\nText:\n[TEXT]",
  },
  {
    id: "root-cause-analysis",
    title: "Root Cause Analysis",
    category: "Analysis",
    tags: ["5 whys", "root cause", "problem"],
    content:
      "Perform a 5 Whys root cause analysis for:\n[PROBLEM]\n\nOutput:\n- Why #1 to #5\n- Root cause statement\n- Corrective actions\n- Preventive actions",
  },
  {
    id: "prd-draft",
    title: "Product Requirements Draft",
    category: "Planning",
    tags: ["product", "requirements", "prd"],
    content:
      "Draft a PRD with sections:\n- Problem\n- Users\n- Scope\n- Non-goals\n- Success metrics\n- Risks\n\nContext:\n[CONTEXT]",
  },
  {
    id: "user-research-plan",
    title: "User Research Plan",
    category: "Planning",
    tags: ["research", "users", "interviews"],
    content:
      "Create a user research plan with:\n- Objectives\n- Methods\n- Participant criteria\n- Discussion guide\n- Timeline\n- Analysis approach\n\nProduct area:\n[PRODUCT AREA]",
  },
  {
    id: "ux-critique-checklist",
    title: "UX Critique Checklist",
    category: "Analysis",
    tags: ["ux", "heuristics", "accessibility"],
    content:
      "Critique this interface using:\n- Usability heuristics\n- Accessibility checks\n- Content clarity\n\nProvide:\n1) Findings\n2) Severity\n3) Suggested fixes\n\nInterface details:\n[DETAILS]",
  },
  {
    id: "feature-brief",
    title: "Feature Brief",
    category: "Writing",
    tags: ["feature", "brief", "stakeholders"],
    content:
      "Write a one-page feature brief including:\n- Problem statement\n- User value\n- Proposed solution\n- Dependencies\n- Launch risks\n\nInputs:\n[INPUTS]",
  },
  {
    id: "competitive-scan",
    title: "Competitive Scan",
    category: "Analysis",
    tags: ["competition", "benchmark", "market"],
    content:
      "Analyze competitors for:\n- Core offerings\n- Strengths/weaknesses\n- Pricing model\n- Differentiation opportunities\n\nTarget segment:\n[SEGMENT]",
  },
];
