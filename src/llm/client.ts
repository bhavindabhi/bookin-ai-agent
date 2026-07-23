import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | undefined;

export function anthropic(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set (see .env.example)");
    client = new Anthropic({ apiKey });
  }
  return client;
}

export const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";

export async function completeText(system: string, user: string): Promise<string> {
  const res = await anthropic().messages.create({
    model: MODEL,
    max_tokens: 1024,
    system,
    messages: [{ role: "user", content: user }],
  });
  const block = res.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text : "";
}
