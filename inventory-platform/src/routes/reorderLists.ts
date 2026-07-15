import { Router } from "express";
import { prisma } from "../db.js";

export const reorderListsRouter = Router();

/**
 * Creates (or reuses) a draft reorder list for one supplier, seeded from
 * whatever's currently low-stock for that supplier. Re-running this (e.g.
 * after scanning more sales) adds newly-low products without touching
 * quantities you've already edited on existing line items.
 */
reorderListsRouter.post("/low-stock/:supplierId/create-draft", async (req, res) => {
  const supplierId = Number(req.params.supplierId);

  const lowStockProducts = await prisma.product.findMany({ where: { supplierId } });
  const stillLow = lowStockProducts.filter((p) => p.stockQuantity <= p.reorderThreshold);

  if (stillLow.length === 0) {
    res.redirect("/low-stock");
    return;
  }

  let draft = await prisma.reorderList.findFirst({ where: { supplierId, status: "draft" } });
  if (!draft) {
    draft = await prisma.reorderList.create({ data: { supplierId, status: "draft" } });
  }

  const existingItems = await prisma.reorderListItem.findMany({ where: { reorderListId: draft.id } });
  const existingProductIds = new Set(existingItems.map((i) => i.productId));

  const newItems = stillLow.filter((p) => !existingProductIds.has(p.id));
  if (newItems.length > 0) {
    await prisma.reorderListItem.createMany({
      data: newItems.map((p) => ({
        reorderListId: draft!.id,
        productId: p.id,
        quantity: p.reorderQuantity > 0 ? p.reorderQuantity : 1,
      })),
    });
  }

  res.redirect(`/reorder-lists/${draft.id}`);
});

reorderListsRouter.get("/reorder-lists", async (req, res) => {
  const lists = await prisma.reorderList.findMany({
    include: { supplier: true, _count: { select: { items: true } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
  res.render("reorder-lists", { title: "Reorder lists", lists });
});

reorderListsRouter.get("/reorder-lists/:id", async (req, res) => {
  const id = Number(req.params.id);
  const list = await prisma.reorderList.findUnique({
    where: { id },
    include: {
      supplier: true,
      items: { include: { product: true }, orderBy: { id: "asc" } },
    },
  });
  if (!list) {
    res.redirect("/reorder-lists");
    return;
  }

  const mailtoHref = buildMailtoHref(list);

  res.render("reorder-list-detail", { title: `Order — ${list.supplier.name}`, list, mailtoHref });
});

reorderListsRouter.post("/reorder-lists/:id", async (req, res) => {
  const id = Number(req.params.id);
  const body = req.body as Record<string, unknown>;

  const updates: Array<Promise<unknown>> = [];
  for (const [key, value] of Object.entries(body)) {
    const match = /^quantity_(\d+)$/.exec(key);
    if (!match) continue;
    const itemId = Number(match[1]);
    const quantity = Math.max(0, Number.parseInt(String(value), 10) || 0);
    updates.push(prisma.reorderListItem.update({ where: { id: itemId }, data: { quantity } }));
  }
  await Promise.all(updates);

  res.redirect(`/reorder-lists/${id}`);
});

reorderListsRouter.post("/reorder-lists/:id/items/:itemId/delete", async (req, res) => {
  await prisma.reorderListItem.delete({ where: { id: Number(req.params.itemId) } });
  res.redirect(`/reorder-lists/${req.params.id}`);
});

reorderListsRouter.post("/reorder-lists/:id/mark-sent", async (req, res) => {
  await prisma.reorderList.update({
    where: { id: Number(req.params.id) },
    data: { status: "sent", sentAt: new Date() },
  });
  res.redirect("/reorder-lists");
});

interface ReorderListForEmail {
  supplier: { name: string; contactEmail: string | null };
  items: Array<{ quantity: number; product: { name: string; barcode: string } }>;
}

/** Builds a mailto: link pre-filling subject + body so the user just hits send in their own email app — no email-provider account needed. */
function buildMailtoHref(list: ReorderListForEmail): string | null {
  if (!list.supplier.contactEmail) return null;

  const subject = `Purchase order — ${new Date().toLocaleDateString("en-GB")}`;
  const lines = list.items.map((item) => `- ${item.product.name} (${item.product.barcode}) x ${item.quantity}`);
  const body = `Hi ${list.supplier.name},\n\nCould you send the following:\n\n${lines.join("\n")}\n\nThanks!`;

  const params = new URLSearchParams({ subject, body });
  return `mailto:${encodeURIComponent(list.supplier.contactEmail)}?${params.toString()}`;
}
