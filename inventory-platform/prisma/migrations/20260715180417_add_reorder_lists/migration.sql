-- CreateTable
CREATE TABLE "ReorderList" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "supplierId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" DATETIME,
    CONSTRAINT "ReorderList_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReorderListItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reorderListId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    CONSTRAINT "ReorderListItem_reorderListId_fkey" FOREIGN KEY ("reorderListId") REFERENCES "ReorderList" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReorderListItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
