import { shopifyGraphQL } from "./client.js";

export interface CustomerMatch {
  id: string;
  displayName: string;
  email: string | null;
  phone: string | null;
}

interface FindCustomerResponse {
  customers: {
    edges: Array<{
      node: {
        id: string;
        displayName: string;
        email: string | null;
        phone: string | null;
      };
    }>;
  };
}

function normalizePhone(phone: string): string {
  // Strip the "whatsapp:" prefix Twilio adds and any non-digit/plus chars.
  return phone.replace(/^whatsapp:/, "").replace(/[^\d+]/g, "");
}

/**
 * Looks up the Shopify customer record matching a WhatsApp phone number, so
 * the agent can apply the right pricing tier and pull order history. Returns
 * null when no clinic account is on file yet (e.g. a first-time inquiry).
 */
export async function findCustomerByPhone(phone: string): Promise<CustomerMatch | null> {
  const normalized = normalizePhone(phone);
  const data = await shopifyGraphQL<FindCustomerResponse>(
    `#graphql
    query FindCustomerByPhone($query: String!) {
      customers(first: 1, query: $query) {
        edges {
          node {
            id
            displayName
            email
            phone
          }
        }
      }
    }`,
    { query: `phone:${normalized}` },
  );

  const match = data.customers.edges[0]?.node;
  return match ? { id: match.id, displayName: match.displayName, email: match.email, phone: match.phone } : null;
}
