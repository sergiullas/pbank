import { executePrompt } from "../chat/executePrompt";
import { extractTemplateVariables, substituteTemplateVariables } from "../promptBank/templateVariables";

type RunPromptTestInput = {
  template: string;
  variables: Record<string, string>;
  attachment?: File;
};

export type PromptTestResult = {
  renderedPrompt: string;
  response: string;
};

export async function runPromptTest({
  template,
  variables,
  attachment,
}: RunPromptTestInput): Promise<PromptTestResult> {
  const templateVariables = extractTemplateVariables(template);
  const requiresContext = templateVariables.some((variable) => variable.isContext);
  const hasAttachment = Boolean(attachment);
  const attachmentText = attachment ? await attachment.text() : "";

  if (requiresContext && !hasAttachment) {
    throw new Error("Attach a file to run this test because the template uses [CONTEXT].");
  }

  const renderedPrompt = substituteTemplateVariables(
    template,
    { ...variables, CONTEXT: attachmentText },
    {
      useAttachedFileForContext: hasAttachment,
      attachedFilePlaceholder: attachmentText,
    },
  );

  const response = await executePrompt({ prompt: renderedPrompt, hasAttachment });

  return { renderedPrompt, response };
}
