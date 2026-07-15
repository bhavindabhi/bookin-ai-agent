import { shopifyGraphQL } from "./client.js";

export interface OrderLineItemSummary {
  title: string;
  quantity: number;
  variantId: string | null;
  sku: string | null;
}

export interface OrderSummary {
  id: string;
  name: string;
  createdAt: string;
  lineItems: OrderLineItemSummary[];
}

interface LastOrderResponse {
  customer: {
    orders: {
      edges: Array<{
        node: {
          id: string;
          name: string;
          createdAt: string;
          lineItems: {
            edges: Array<{
              node: {
                title: string;
                quantity: number;
                variant: { id: string; sku: string | null } | null;
              };
            }>;
          };
        };
      }>;
    };
  } | null;
}

export async function getLastOrder(customerId: string): Promise<OrderSummary | null> {
  const data = await shopifyGraphQL<LastOrderResponse>(
    `#graphql
    query LastOrder($customerId: ID!) {
      customer(id: $customerId) {
        orders(first: 1, sortKey: CREATED_AT, reverse: true) {
          edges {
            node {
              id
              name
              createdAt
              lineItems(first: 25) {
                edges {
                  node {
                    title
                    quantity
                    variant { id sku }
                  }
                }
              }
            }
          }
        }
      }
    }`,
    { customerId },
  );

  const order = data.customer?.orders.edges[0]?.node;
  if (!order) return null;

  return {
    id: order.id,
    name: order.name,
    createdAt: order.createdAt,
    lineItems: order.lineItems.edges.map(({ node }) => ({
      title: node.title,
      quantity: node.quantity,
      variantId: node.variant?.id ?? null,
      sku: node.variant?.sku ?? null,
    })),
  };
}

export interface DraftOrderLineItem {
  variantId: string;
  quantity: number;
}

export interface DraftOrderResult {
  id: string;
  name: string;
  invoiceUrl: string;
  totalPrice: string;
}

interface DraftOrderCreateResponse {
  draftOrderCreate: {
    draftOrder: {
      id: string;
      name: string;
      invoiceUrl: string;
      totalPrice: string;
    } | null;
    userErrors: Array<{ field: string[] | null; message: string }>;
  };
}

/**
 * Creates a draft order rather than a real order, so a human (or a payment
 * step) confirms before it's finalized. The invoice URL can be sent straight
 * back to the clinic over WhatsApp.
 */
export async function createDraftOrder(
  customerId: string | null,
  lineItems: DraftOrderLineItem[],
  note?: string,
): Promise<DraftOrderResult> {
  const data = await shopifyGraphQL<DraftOrderCreateResponse>(
    `#graphql
    mutation CreateDraftOrder($input: DraftOrderInput!) {
      draftOrderCreate(input: $input) {
        draftOrder {
          id
          name
          invoiceUrl
          totalPrice
        }
        userErrors {
          field
          message
        }
      }
    }`,
    {
      input: {
        customerId: customerId ?? undefined,
        lineItems: lineItems.map((li) => ({ variantId: li.variantId, quantity: li.quantity })),
        note,
      },
    },
  );

  const { draftOrder, userErrors } = data.draftOrderCreate;
  if (userErrors.length > 0 || !draftOrder) {
    throw new Error(`Failed to create draft order: ${userErrors.map((e) => e.message).join("; ")}`);
  }
  return draftOrder;
}

export interface OrderStatus {
  name: string;
  fulfillmentStatus: string;
  financialStatus: string;
  createdAt: string;
  totalPrice: string;
}

interface OrderStatusResponse {
  orders: {
    edges: Array<{
      node: {
        name: string;
        displayFulfillmentStatus: string;
        displayFinancialStatus: string;
        createdAt: string;
        totalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
      };
    }>;
  };
}

/** Looks up order status by order name, e.g. "#1001" or "1001". */
export async function getOrderStatus(orderName: string): Promise<OrderStatus | null> {
  const normalized = orderName.startsWith("#") ? orderName : `#${orderName}`;
  const data = await shopifyGraphQL<OrderStatusResponse>(
    `#graphql
    query OrderStatus($query: String!) {
      orders(first: 1, query: $query) {
        edges {
          node {
            name
            displayFulfillmentStatus
            displayFinancialStatus
            createdAt
            totalPriceSet {
              shopMoney { amount currencyCode }
            }
          }
        }
      }
    }`,
    { query: `name:${normalized}` },
  );

  const order = data.orders.edges[0]?.node;
  if (!order) return null;

  return {
    name: order.name,
    fulfillmentStatus: order.displayFulfillmentStatus,
    financialStatus: order.displayFinancialStatus,
    createdAt: order.createdAt,
    totalPrice: `${order.totalPriceSet.shopMoney.amount} ${order.totalPriceSet.shopMoney.currencyCode}`,
  };
}
