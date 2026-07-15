import { config } from "../config.js";

const GRAPHQL_ENDPOINT = `https://${config.shopifyStoreDomain}/admin/api/${config.shopifyApiVersion}/graphql.json`;

export class ShopifyError extends Error {
  constructor(message: string, public readonly details?: unknown) {
    super(message);
    this.name = "ShopifyError";
  }
}

/**
 * Thin wrapper around the Shopify Admin GraphQL API. GraphQL (rather than
 * REST) is used throughout so product search, customer lookup, and order
 * creation can each be a single structured request.
 */
export async function shopifyGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": config.shopifyAdminApiToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new ShopifyError(`Shopify API request failed (${response.status})`, text);
  }

  const json = (await response.json()) as { data?: T; errors?: unknown };
  if (json.errors) {
    throw new ShopifyError("Shopify GraphQL returned errors", json.errors);
  }
  if (!json.data) {
    throw new ShopifyError("Shopify GraphQL returned no data");
  }
  return json.data;
}
