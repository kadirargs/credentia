export type AssistantRole = "user" | "assistant";

export type AssistantMessage = {
  role: AssistantRole;
  content: string;
};

export type AssistantResponse = {
  answer: string;
  usedData: Record<string, unknown>;
  disclaimer: string;
};
