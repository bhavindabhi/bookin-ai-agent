import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface VolumeTier {
  minQty: number;
  unitPrice: number;
}

export interface Product {
  sku: string;
  name: string;
  listPrice: number;
  floorPrice: number;
  unit: string;
  volumeTiers: VolumeTier[];
}

export interface Pricebook {
  currency: string;
  products: Product[];
}

/**
 * Resolves the pricebook file to use. Set PRICEBOOK_PATH to point at your
 * real pricing config; otherwise falls back to the example file so the
 * pipeline is runnable out of the box.
 */
export function loadPricebook(): Pricebook {
  const configuredPath = process.env.PRICEBOOK_PATH;
  const fallbackPath = path.resolve(__dirname, "../config/pricebook.example.json");
  const target = configuredPath && fs.existsSync(configuredPath) ? configuredPath : fallbackPath;
  const raw = fs.readFileSync(target, "utf-8");
  return JSON.parse(raw) as Pricebook;
}

export function findProduct(pricebook: Pricebook, sku: string): Product | undefined {
  return pricebook.products.find((p) => p.sku === sku);
}
