export type ExecutePromptInput = {
  prompt: string;
  hasAttachment?: boolean;
};

const buildMockAssistantResponse = ({ prompt, hasAttachment }: ExecutePromptInput): string => {
  const trimmedPrompt = prompt.trim();
  const promptPreview =
    trimmedPrompt.length > 140 ? `${trimmedPrompt.slice(0, 140)}…` : trimmedPrompt;

  return [
    "Mock reply: Prompt executed successfully.",
    hasAttachment ? "Attached file context was included." : "No file context attached.",
    `Prompt preview: ${promptPreview || "(empty prompt)"}`,
  ].join("\n");
};

export function executePrompt(input: ExecutePromptInput): Promise<string> {
  const timeout = 300 + Math.floor(Math.random() * 301);

  return new Promise((resolve) => {
    window.setTimeout(() => {
      resolve(buildMockAssistantResponse(input));
    }, timeout);
  });
}
