import { Router } from "express";
import { prisma } from "../db.js";

export const lowStockRouter = Router();

lowStockRouter.get("/low-stock", async (req, res) => {
  const products = await prisma.product.findMany({
    include: { supplier: true },
    orderBy: { name: "asc" },
  });

  const lowStockProducts = products.filter((p) => p.stockQuantity <= p.reorderThreshold);

  // Group by supplier so a shop owner can see "here's what to order from
  // each supplier" rather than one flat list.
  const bySupplier = new Map<string, typeof lowStockProducts>();
  for (const product of lowStockProducts) {
    const key = product.supplier?.name ?? "No supplier assigned";
    const list = bySupplier.get(key) ?? [];
    list.push(product);
    bySupplier.set(key, list);
  }

  res.render("low-stock", {
    title: "Low stock",
    groups: Array.from(bySupplier.entries()).map(([supplierName, items]) => ({ supplierName, items })),
  });
});
