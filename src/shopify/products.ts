import { shopifyGraphQL } from "./client.js";

export interface ProductVariantMatch {
  variantId: string;
  productId: string;
  productTitle: string;
  variantTitle: string;
  sku: string | null;
  price: string;
  inventoryQuantity: number | null;
}

interface SearchProductsResponse {
  products: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        variants: {
          edges: Array<{
            node: {
              id: string;
              title: string;
              sku: string | null;
              price: string;
              inventoryQuantity: number | null;
            };
          }>;
        };
      };
    }>;
  };
}

/**
 * Full-text search across product title, SKU, and vendor. Shopify's search
 * syntax (the `query` string) matches partial/fuzzy terms, so "gloves M" and
 * "nitrile gloves medium" both work reasonably well without exact SKUs.
 */
export async function searchProducts(
  searchTerm: string,
  limit = 5,
): Promise<ProductVariantMatch[]> {
  const data = await shopifyGraphQL<SearchProductsResponse>(
    `#graphql
    query SearchProducts($query: String!, $limit: Int!) {
      products(first: $limit, query: $query) {
        edges {
          node {
            id
            title
            variants(first: 10) {
              edges {
                node {
                  id
                  title
                  sku
                  price
                  inventoryQuantity
                }
              }
            }
          }
        }
      }
    }`,
    { query: searchTerm, limit },
  );

  const matches: ProductVariantMatch[] = [];
  for (const { node: product } of data.products.edges) {
    for (const { node: variant } of product.variants.edges) {
      matches.push({
        variantId: variant.id,
        productId: product.id,
        productTitle: product.title,
        variantTitle: variant.title,
        sku: variant.sku,
        price: variant.price,
        inventoryQuantity: variant.inventoryQuantity,
      });
    }
  }
  return matches;
}
