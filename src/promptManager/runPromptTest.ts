import { executePrompt } from "../chat/executePrompt";
import { parseTemplateVariables, substituteTemplateVariables } from "../promptBank/templateVariables";

type RunPromptTestInput = {
  template: string;
  variables: Record<string, string>;
  attachment?: File;
};

export async function renderPromptTestTemplate({
  template,
  variables,
  attachment,
}: RunPromptTestInput): Promise<string> {
  const { variables: templateVariables, invalidTokens } = parseTemplateVariables(template);
  const requiresContext = templateVariables.some((variable) => variable.isContext);
  const hasAttachment = Boolean(attachment);
  const attachmentText = attachment ? await attachment.text() : "";

  if (invalidTokens.length > 0) {
    throw new Error(invalidTokens[0].message);
  }

  if (requiresContext && !attachmentText.trim()) {
    throw new Error("Attach a file to run this test because the template uses [CONTEXT].");
  }

  return substituteTemplateVariables(
    template,
    { ...variables, CONTEXT: attachmentText },
    {
      useAttachedFileForContext: hasAttachment,
      attachedFilePlaceholder: attachmentText,
    },
  );
}

export async function runPromptTest(input: RunPromptTestInput): Promise<string> {
  const renderedPrompt = await renderPromptTestTemplate(input);
  return executePrompt({ prompt: renderedPrompt, hasAttachment: Boolean(input.attachment) });
}
