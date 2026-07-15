import { Router } from "express";
import { prisma } from "../db.js";

export const productsRouter = Router();

productsRouter.get("/products", async (req, res) => {
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    include: { supplier: true },
  });
  res.render("products", { title: "Products", products });
});

productsRouter.get("/products/new", async (req, res) => {
  const suppliers = await prisma.supplier.findMany({ orderBy: { name: "asc" } });
  res.render("product-form", { title: "Add product", product: null, suppliers, error: null });
});

productsRouter.post("/products", async (req, res) => {
  const suppliers = await prisma.supplier.findMany({ orderBy: { name: "asc" } });
  const parsed = parseProductForm(req.body);
  if (parsed.error) {
    res.render("product-form", { title: "Add product", product: req.body, suppliers, error: parsed.error });
    return;
  }

  try {
    await prisma.product.create({ data: parsed.data });
    res.redirect("/products");
  } catch (err) {
    res.render("product-form", {
      title: "Add product",
      product: req.body,
      suppliers,
      error: "A product with that barcode already exists.",
    });
  }
});

productsRouter.get("/products/:id/edit", async (req, res) => {
  const [product, suppliers] = await Promise.all([
    prisma.product.findUnique({ where: { id: Number(req.params.id) } }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!product) {
    res.redirect("/products");
    return;
  }
  res.render("product-form", { title: "Edit product", product, suppliers, error: null });
});

productsRouter.post("/products/:id", async (req, res) => {
  const id = Number(req.params.id);
  const suppliers = await prisma.supplier.findMany({ orderBy: { name: "asc" } });
  const parsed = parseProductForm(req.body);
  if (parsed.error) {
    res.render("product-form", { title: "Edit product", product: { id, ...req.body }, suppliers, error: parsed.error });
    return;
  }

  try {
    await prisma.product.update({ where: { id }, data: parsed.data });
    res.redirect("/products");
  } catch (err) {
    res.render("product-form", {
      title: "Edit product",
      product: { id, ...req.body },
      suppliers,
      error: "A product with that barcode already exists.",
    });
  }
});

productsRouter.post("/products/:id/delete", async (req, res) => {
  await prisma.product.delete({ where: { id: Number(req.params.id) } });
  res.redirect("/products");
});

interface ParsedProduct {
  error?: string;
  data: {
    barcode: string;
    name: string;
    costPrice: number | null;
    sellPrice: number | null;
    stockQuantity: number;
    reorderThreshold: number;
    reorderQuantity: number;
    supplierId: number | null;
  };
}

function parseProductForm(body: Record<string, unknown>): ParsedProduct {
  const barcode = String(body.barcode ?? "").trim();
  const name = String(body.name ?? "").trim();
  const data = {
    barcode,
    name,
    costPrice: toNullableFloat(body.costPrice),
    sellPrice: toNullableFloat(body.sellPrice),
    stockQuantity: toInt(body.stockQuantity),
    reorderThreshold: toInt(body.reorderThreshold),
    reorderQuantity: toInt(body.reorderQuantity),
    supplierId: body.supplierId ? Number(body.supplierId) : null,
  };

  if (!barcode || !name) {
    return { error: "Barcode and name are required.", data };
  }
  return { data };
}

function toInt(value: unknown): number {
  const n = Number.parseInt(String(value ?? "0"), 10);
  return Number.isFinite(n) ? n : 0;
}

function toNullableFloat(value: unknown): number | null {
  const str = String(value ?? "").trim();
  if (!str) return null;
  const n = Number.parseFloat(str);
  return Number.isFinite(n) ? n : null;
}
