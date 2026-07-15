import type Anthropic from "@anthropic-ai/sdk";

/**
 * In-memory per-phone-number conversation history. Fine for a single-process
 * MVP; swap for Redis/Postgres before running more than one server instance
 * or if history needs to survive a restart.
 */
const MAX_MESSAGES_PER_CONVERSATION = 40;

class ConversationStore {
  private readonly conversations = new Map<string, Anthropic.MessageParam[]>();

  get(phone: string): Anthropic.MessageParam[] {
    return this.conversations.get(phone) ?? [];
  }

  append(phone: string, message: Anthropic.MessageParam): void {
    const history = this.conversations.get(phone) ?? [];
    history.push(message);
    if (history.length > MAX_MESSAGES_PER_CONVERSATION) {
      history.splice(0, history.length - MAX_MESSAGES_PER_CONVERSATION);
    }
    this.conversations.set(phone, history);
  }

  clear(phone: string): void {
    this.conversations.delete(phone);
  }
}

export const conversationStore = new ConversationStore();
