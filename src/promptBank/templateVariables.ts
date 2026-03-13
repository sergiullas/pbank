export type TemplateVariable = {
  token: string;
  raw: string;
  isContext: boolean;
};

const BRACKET_TOKEN_REGEX = /\[([^\]]+)\]/g;

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function extractTemplateVariables(template: string): TemplateVariable[] {
  const seen = new Set<string>();
  const result: TemplateVariable[] = [];

  let match: RegExpExecArray | null;
  while ((match = BRACKET_TOKEN_REGEX.exec(template)) !== null) {
    const token = match[1].trim();
    if (!token || seen.has(token)) continue;

    seen.add(token);
    result.push({
      token,
      raw: `[${token}]`,
      isContext: token === "CONTEXT",
    });
  }

  return result;
}

export function substituteTemplateVariables(
  template: string,
  values: Record<string, string>,
  options?: {
    useAttachedFileForContext?: boolean;
    attachedFilePlaceholder?: string;
  },
): string {
  let output = template;

  if (options?.useAttachedFileForContext) {
    const placeholder = options.attachedFilePlaceholder ?? "[Attached file context]";
    output = output.replace(/\[CONTEXT\]/g, placeholder);
  } else if (values.CONTEXT?.trim()) {
    output = output.replace(/\[CONTEXT\]/g, values.CONTEXT);
  }

  for (const [token, value] of Object.entries(values)) {
    if (token === "CONTEXT") continue;
    if (!value?.trim()) continue;

    const escapedToken = escapeRegExp(token);
    output = output.replace(new RegExp(`\\[${escapedToken}\\]`, "g"), value);
  }

  return output;
}
