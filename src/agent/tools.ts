import type Anthropic from "@anthropic-ai/sdk";
import { searchProducts } from "../shopify/products.js";
import { getLastOrder, createDraftOrder, getOrderStatus } from "../shopify/orders.js";

export interface ToolContext {
  /** Shopify customer GID, or null if this WhatsApp number isn't linked to an account yet. */
  customerId: string | null;
  /** Raw WhatsApp "from" address, e.g. "whatsapp:+15551234567". */
  phone: string;
}

/**
 * Tool schemas sent to Claude. `cache_control` on the last tool caches this
 * whole array (plus the system prompt, which renders right after it) across
 * every request — see claude.ts for why that matters for a chat service.
 */
export const TOOLS: Anthropic.Tool[] = [
  {
    name: "search_products",
    description:
      "Search the dental supply catalog by product name, SKU, or description. Use this whenever a customer names a product " +
      "(e.g. 'nitrile gloves medium', 'composite resin', SKU 'GLV-M-100') to find the matching variant, current price, and stock level.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Product name, SKU, or description to search for.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "check_last_order",
    description:
      "Fetch the customer's most recent order (line items and date) so they can quickly reorder the same items. " +
      "Only works if a Shopify customer account is linked to this WhatsApp number.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "create_order",
    description:
      "Create a draft order in Shopify for the items the customer has confirmed. This does NOT charge the customer immediately " +
      "— it generates an invoice/checkout link that is sent back to them for payment. Only call this after the customer has " +
      "explicitly confirmed the exact items and quantities.",
    input_schema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          description: "Line items to include, using variant IDs returned by search_products or check_last_order.",
          items: {
            type: "object",
            properties: {
              variant_id: {
                type: "string",
                description: "Shopify product variant GID, e.g. gid://shopify/ProductVariant/123456789.",
              },
              quantity: {
                type: "integer",
                minimum: 1,
                description: "Quantity of this variant to order.",
              },
            },
            required: ["variant_id", "quantity"],
          },
        },
        note: {
          type: "string",
          description: "Optional order note, e.g. delivery instructions or a purchase order reference.",
        },
      },
      required: ["items"],
    },
  },
  {
    name: "check_order_status",
    description: "Look up the fulfillment and payment status of an existing order by its order number.",
    input_schema: {
      type: "object",
      properties: {
        order_name: {
          type: "string",
          description: "Order number as given by the customer, e.g. '#1042' or '1042'.",
        },
      },
      required: ["order_name"],
    },
    // Caches the entire tool list (all four definitions render as one array)
    // plus the system prompt that follows it — see claude.ts.
    cache_control: { type: "ephemeral" },
  },
];

export interface ToolExecutionResult {
  content: string;
  isError: boolean;
}

export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  context: ToolContext,
): Promise<ToolExecutionResult> {
  switch (name) {
    case "search_products": {
      const matches = await searchProducts(String(input.query ?? ""));
      return {
        content: JSON.stringify(matches.length > 0 ? matches : { message: "No matching products found." }),
        isError: false,
      };
    }

    case "check_last_order": {
      if (!context.customerId) {
        return {
          content: JSON.stringify({
            error:
              "No Shopify customer account is linked to this WhatsApp number yet. Ask for their clinic name or account email, " +
              "or offer to take the order as a new customer.",
          }),
          isError: false,
        };
      }
      const order = await getLastOrder(context.customerId);
      return {
        content: JSON.stringify(order ?? { message: "No previous orders found for this customer." }),
        isError: false,
      };
    }

    case "create_order": {
      const rawItems = Array.isArray(input.items) ? (input.items as Array<Record<string, unknown>>) : [];
      const items = rawItems.map((item) => ({
        variantId: String(item.variant_id),
        quantity: Number(item.quantity),
      }));
      const draft = await createDraftOrder(context.customerId, items, input.note ? String(input.note) : undefined);
      return { content: JSON.stringify(draft), isError: false };
    }

    case "check_order_status": {
      const status = await getOrderStatus(String(input.order_name ?? ""));
      return {
        content: JSON.stringify(status ?? { message: "No order found with that number." }),
        isError: false,
      };
    }

    default:
      return { content: `Unknown tool: ${name}`, isError: true };
  }
}
