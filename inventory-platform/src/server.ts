import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import session from "express-session";
import { requireAuth } from "./auth.js";
import { authRouter } from "./routes/auth.js";
import { scanRouter } from "./routes/scan.js";
import { productsRouter } from "./routes/products.js";
import { suppliersRouter } from "./routes/suppliers.js";
import { lowStockRouter } from "./routes/lowStock.js";
import { reorderListsRouter } from "./routes/reorderLists.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("Missing required environment variable: SESSION_SECRET");
}

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }, // 7 days
  }),
);

// Public routes: account setup and login.
app.use(authRouter);

// Everything below requires a logged-in session.
app.use(requireAuth);
app.use(scanRouter);
app.use(productsRouter);
app.use(suppliersRouter);
app.use(lowStockRouter);
app.use(reorderListsRouter);

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`Inventory platform listening on port ${port}`);
});
