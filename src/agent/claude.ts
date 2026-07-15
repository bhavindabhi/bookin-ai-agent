import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config.js";
import { conversationStore } from "./conversation-store.js";
import { TOOLS, executeTool, type ToolContext } from "./tools.js";
import type { CustomerMatch } from "../shopify/customers.js";

const client = new Anthropic({ apiKey: config.anthropicApiKey });

/**
 * Frozen at process startup, never interpolated per-request. That's what
 * makes it cacheable: prompt caching is a byte-exact prefix match, so a
 * system prompt that embeds a customer name or timestamp would invalidate
 * the cache on every single message. Per-customer context is injected once,
 * into the first user turn of a conversation, instead — see
 * buildInitialUserContent() below.
 */
const SYSTEM_PROMPT = `You are the WhatsApp ordering assistant for ${config.businessName}, a wholesale supplier of dental \
consumables and equipment selling to dental practices (B2B, not consumers).

Your job: help clinics reorder supplies quickly over WhatsApp. Common requests:
- Reordering items they've bought before ("same as last time", "reorder my usual gloves")
- Ordering specific products by name or SKU, with quantities
- Checking the price or stock of a product before ordering
- Checking the status of an existing order

Guidelines:
- Always resolve a product to a specific variant (via search_products) and confirm quantity, size/variant, and price with the \
customer BEFORE calling create_order. Never guess a variant.
- If check_last_order returns items, offer to reorder them exactly, but let the customer adjust quantities or swap items first.
- Prices and stock levels come only from tool results — never state a price or availability from memory.
- Keep replies short and WhatsApp-appropriate: a few lines, no markdown headers, no long bullet essays.
- If a customer isn't linked to an account (see check_last_order's response), ask for their clinic name or account email so a \
human can match the order manually, but still let them describe what they want to order.
- After create_order succeeds, send the customer the invoice/checkout link from the result and tell them the order is pending \
payment confirmation — do not claim it has shipped or been paid.
- If a request is ambiguous (wrong product, no stock, unclear quantity), ask a short clarifying question rather than guessing.`;

function buildInitialUserContent(text: string, customer: CustomerMatch | null): string {
  const contextNote = customer
    ? `[System note: matched Shopify customer "${customer.displayName}" (id ${customer.id}) for this WhatsApp number.]`
    : "[System note: no Shopify customer account is linked to this WhatsApp number yet.]";
  return `${contextNote}\n\n${text}`;
}

function extractText(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

/**
 * Clones the stored history and places a cache breakpoint on the last block
 * of the second-to-last message (i.e. right before the newest user turn).
 * That caches "everything up through the previous turn" so each new message
 * only pays full price for itself, not the whole growing conversation.
 * Mutating a clone (not the stored history) keeps at most one active
 * breakpoint here — cache_control on old, superseded messages would count
 * against the 4-breakpoint-per-request limit for no benefit.
 */
function buildRequestMessages(history: Anthropic.MessageParam[]): Anthropic.MessageParam[] {
  const cloned = history.map((message) => ({ ...message }));
  if (cloned.length < 2) return cloned;

  const target = cloned[cloned.length - 2];
  if (typeof target.content === "string") {
    target.content = [{ type: "text", text: target.content, cache_control: { type: "ephemeral" } }];
  } else if (Array.isArray(target.content) && target.content.length > 0) {
    const blocks = [...target.content];
    const lastIndex = blocks.length - 1;
    blocks[lastIndex] = { ...blocks[lastIndex], cache_control: { type: "ephemeral" } } as Anthropic.ContentBlockParam;
    target.content = blocks;
  }
  return cloned;
}

const MAX_TOOL_ITERATIONS = 6;

export async function handleIncomingMessage(
  phone: string,
  text: string,
  customer: CustomerMatch | null,
): Promise<string> {
  const isNewConversation = conversationStore.get(phone).length === 0;
  const userContent = isNewConversation ? buildInitialUserContent(text, customer) : text;

  conversationStore.append(phone, { role: "user", content: userContent });

  const context: ToolContext = { customerId: customer?.id ?? null, phone };
  const messages = buildRequestMessages(conversationStore.get(phone));

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
    const response = await client.messages.create({
      model: config.claudeModel,
      max_tokens: 1024,
      system: [{ type: "text", text: SYSTEM_PROMPT }],
      tools: TOOLS,
      messages,
    });

    // response.content (Anthropic.ContentBlock[]) is structurally compatible
    // with the ContentBlockParam[] a follow-up MessageParam expects; the SDK
    // examples push it back directly rather than re-mapping each block.
    const assistantContent = response.content as unknown as Anthropic.MessageParam["content"];
    messages.push({ role: "assistant", content: assistantContent });
    conversationStore.append(phone, { role: "assistant", content: assistantContent });

    if (response.stop_reason !== "tool_use") {
      const finalText = extractText(response.content);
      return finalText || "Sorry, I had trouble with that — could you rephrase?";
    }

    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
    );

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of toolUseBlocks) {
      const result = await executeTool(block.name, block.input as Record<string, unknown>, context);
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: result.content,
        is_error: result.isError,
      });
    }

    messages.push({ role: "user", content: toolResults });
    conversationStore.append(phone, { role: "user", content: toolResults });
  }

  return "Sorry, that request is taking a bit long to process — a team member will follow up shortly.";
}
