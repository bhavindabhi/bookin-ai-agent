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
  // each supplier" rather than one flat list. Keyed by supplierId (null for
  // "no supplier assigned") so we can link each group to its draft order.
  const groupsBySupplierId = new Map<number | null, { supplierId: number | null; supplierName: string; items: typeof lowStockProducts }>();
  for (const product of lowStockProducts) {
    const key = product.supplierId;
    const group = groupsBySupplierId.get(key) ?? {
      supplierId: key,
      supplierName: product.supplier?.name ?? "No supplier assigned",
      items: [],
    };
    group.items.push(product);
    groupsBySupplierId.set(key, group);
  }

  const supplierIds = Array.from(groupsBySupplierId.keys()).filter((id): id is number => id !== null);
  const draftLists = supplierIds.length
    ? await prisma.reorderList.findMany({
        where: { supplierId: { in: supplierIds }, status: "draft" },
        include: { _count: { select: { items: true } } },
      })
    : [];
  const draftBySupplierId = new Map(draftLists.map((d) => [d.supplierId, d]));

  const groups = Array.from(groupsBySupplierId.values()).map((group) => ({
    ...group,
    draft: group.supplierId !== null ? draftBySupplierId.get(group.supplierId) ?? null : null,
  }));

  res.render("low-stock", { title: "Low stock", groups });
});
