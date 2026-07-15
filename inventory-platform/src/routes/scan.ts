import { Router } from "express";
import { prisma } from "../db.js";

export const scanRouter = Router();

scanRouter.get("/", (req, res) => {
  res.render("dashboard", { title: "Scan" });
});

/**
 * Core loop: a barcode scanner is a keyboard-wedge device — it types the
 * digits then hits Enter, so the frontend is just a plain text input.
 * This endpoint looks the barcode up, decrements stock by 1, and logs a
 * StockMovement. Doesn't go below 0 stock; flags it instead.
 */
scanRouter.post("/api/scan", async (req, res) => {
  const barcode = String(req.body.barcode ?? "").trim();
  if (!barcode) {
    res.status(400).json({ error: "No barcode provided." });
    return;
  }

  const product = await prisma.product.findUnique({
    where: { barcode },
    include: { supplier: true },
  });

  if (!product) {
    res.status(404).json({ error: `No product found for barcode "${barcode}". Add it in Products first.` });
    return;
  }

  let updated = product;
  let warning: string | undefined;

  if (product.stockQuantity > 0) {
    updated = await prisma.product.update({
      where: { id: product.id },
      data: { stockQuantity: { decrement: 1 } },
      include: { supplier: true },
    });
    await prisma.stockMovement.create({
      data: { productId: product.id, changeQty: -1, reason: "scan_sale" },
    });
  } else {
    warning = "Stock for this product is already at 0.";
  }

  res.json({
    product: {
      id: updated.id,
      name: updated.name,
      barcode: updated.barcode,
      stockQuantity: updated.stockQuantity,
      reorderThreshold: updated.reorderThreshold,
      supplierName: updated.supplier?.name ?? null,
    },
    lowStock: updated.stockQuantity <= updated.reorderThreshold,
    warning,
  });
});
