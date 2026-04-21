export type TemplateVariable = {
  token: string;
  raw: string;
  isContext: boolean;
  type: TokenType;
};

export type TokenType = "text" | "textarea" | "context";

export type InvalidTemplateToken = {
  raw: string;
  message: string;
};

export type TemplateVariableParseResult = {
  variables: TemplateVariable[];
  invalidTokens: InvalidTemplateToken[];
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildVariable = (name: string, raw: string, isDoubleBracket: boolean): TemplateVariable | InvalidTemplateToken => {
  if (name === "CONTEXT" && isDoubleBracket) {
    return {
      raw,
      message: "[[CONTEXT]] is not supported. Use [CONTEXT] for file input.",
    };
  }

  const type: TokenType = name === "CONTEXT" ? "context" : isDoubleBracket ? "textarea" : "text";
  return {
    token: name,
    raw,
    isContext: type === "context",
    type,
  };
};

export function parseTemplateVariables(template: string): TemplateVariableParseResult {
  const seen = new Map<string, TemplateVariable>();
  const invalidTokens: InvalidTemplateToken[] = [];
  let index = 0;

  while (index < template.length) {
    if (template[index] !== "[") {
      index += 1;
      continue;
    }

    const isDoubleBracket = template[index + 1] === "[";
    const openLength = isDoubleBracket ? 2 : 1;
    const closeDelimiter = isDoubleBracket ? "]]" : "]";
    const closeIndex = template.indexOf(closeDelimiter, index + openLength);

    if (closeIndex === -1) {
      const raw = template.slice(index, Math.min(template.length, index + 32));
      invalidTokens.push({ raw, message: "Unclosed token bracket." });
      break;
    }

    const raw = template.slice(index, closeIndex + closeDelimiter.length);
    const tokenValue = template.slice(index + openLength, closeIndex).trim();

    if (!tokenValue) {
      invalidTokens.push({ raw, message: "Token name cannot be empty." });
      index = closeIndex + closeDelimiter.length;
      continue;
    }

    if (tokenValue.includes("[") || tokenValue.includes("]")) {
      invalidTokens.push({ raw, message: "Nested tokens are not supported." });
      index = closeIndex + closeDelimiter.length;
      continue;
    }

    const nextVariable = buildVariable(tokenValue, raw, isDoubleBracket);
    if ("message" in nextVariable) {
      invalidTokens.push(nextVariable);
      index = closeIndex + closeDelimiter.length;
      continue;
    }

    const existing = seen.get(nextVariable.token);
    if (!existing) {
      seen.set(nextVariable.token, nextVariable);
    } else if (existing.type === "text" && nextVariable.type === "textarea") {
      // If mixed syntax is used for the same token, prefer the richer textarea behavior.
      seen.set(nextVariable.token, nextVariable);
    }

    index = closeIndex + closeDelimiter.length;
  }

  return { variables: [...seen.values()], invalidTokens };
}

export function extractTemplateVariables(template: string): TemplateVariable[] {
  return parseTemplateVariables(template).variables;
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
    output = output.replace(new RegExp(`\\[\\[${escapedToken}\\]\\]`, "g"), value);
    output = output.replace(new RegExp(`\\[${escapedToken}\\]`, "g"), value);
  }

  return output;
}
