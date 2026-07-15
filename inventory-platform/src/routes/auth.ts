import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../db.js";

export const authRouter = Router();

/**
 * One-time setup: only reachable while no user exists yet. Once a user is
 * created, this always redirects to /login — there's no multi-admin flow
 * in Phase 1.
 */
authRouter.get("/setup", async (req, res) => {
  const existing = await prisma.user.findFirst();
  if (existing) {
    res.redirect("/login");
    return;
  }
  res.render("setup", { title: "Set up your account" });
});

authRouter.post("/setup", async (req, res) => {
  const existing = await prisma.user.findFirst();
  if (existing) {
    res.redirect("/login");
    return;
  }

  const email = String(req.body.email ?? "").trim().toLowerCase();
  const password = String(req.body.password ?? "");
  if (!email || password.length < 8) {
    res.render("setup", { title: "Set up your account", error: "Enter a valid email and a password of at least 8 characters." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, passwordHash } });
  req.session.userId = user.id;
  res.redirect("/");
});

authRouter.get("/login", (req, res) => {
  if (req.session.userId) {
    res.redirect("/");
    return;
  }
  res.render("login", { title: "Log in" });
});

authRouter.post("/login", async (req, res) => {
  const email = String(req.body.email ?? "").trim().toLowerCase();
  const password = String(req.body.password ?? "");

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!user || !valid) {
    res.render("login", { title: "Log in", error: "Incorrect email or password." });
    return;
  }

  req.session.userId = user.id;
  res.redirect("/");
});

authRouter.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});
