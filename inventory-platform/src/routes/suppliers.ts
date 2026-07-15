import { Router } from "express";
import { prisma } from "../db.js";

export const suppliersRouter = Router();

suppliersRouter.get("/suppliers", async (req, res) => {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  res.render("suppliers", { title: "Suppliers", suppliers });
});

suppliersRouter.get("/suppliers/new", (req, res) => {
  res.render("supplier-form", { title: "Add supplier", supplier: null, error: null });
});

suppliersRouter.post("/suppliers", async (req, res) => {
  const name = String(req.body.name ?? "").trim();
  if (!name) {
    res.render("supplier-form", { title: "Add supplier", supplier: req.body, error: "Name is required." });
    return;
  }
  await prisma.supplier.create({
    data: {
      name,
      contactEmail: emptyToNull(req.body.contactEmail),
      contactPhone: emptyToNull(req.body.contactPhone),
      notes: emptyToNull(req.body.notes),
    },
  });
  res.redirect("/suppliers");
});

suppliersRouter.get("/suppliers/:id/edit", async (req, res) => {
  const supplier = await prisma.supplier.findUnique({ where: { id: Number(req.params.id) } });
  if (!supplier) {
    res.redirect("/suppliers");
    return;
  }
  res.render("supplier-form", { title: "Edit supplier", supplier, error: null });
});

suppliersRouter.post("/suppliers/:id", async (req, res) => {
  const id = Number(req.params.id);
  const name = String(req.body.name ?? "").trim();
  if (!name) {
    res.render("supplier-form", { title: "Edit supplier", supplier: { id, ...req.body }, error: "Name is required." });
    return;
  }
  await prisma.supplier.update({
    where: { id },
    data: {
      name,
      contactEmail: emptyToNull(req.body.contactEmail),
      contactPhone: emptyToNull(req.body.contactPhone),
      notes: emptyToNull(req.body.notes),
    },
  });
  res.redirect("/suppliers");
});

suppliersRouter.post("/suppliers/:id/delete", async (req, res) => {
  const id = Number(req.params.id);
  // Products referencing this supplier just lose the reference (supplierId
  // becomes null via onDelete default) rather than being deleted themselves.
  await prisma.product.updateMany({ where: { supplierId: id }, data: { supplierId: null } });
  await prisma.supplier.delete({ where: { id } });
  res.redirect("/suppliers");
});

function emptyToNull(value: unknown): string | null {
  const str = String(value ?? "").trim();
  return str.length > 0 ? str : null;
}
