-- CreateTable
CREATE TABLE "GroceryList" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroceryList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroceryListMeal" (
    "id" SERIAL NOT NULL,
    "groceryListId" INTEGER NOT NULL,
    "mealId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroceryListMeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroceryListItem" (
    "id" SERIAL NOT NULL,
    "groceryListId" INTEGER NOT NULL,
    "ingredientId" INTEGER,
    "nameSnapshot" TEXT NOT NULL,
    "category" "IngredientCategory",
    "quantity" DECIMAL(65,30),
    "unit" TEXT,
    "note" TEXT,
    "isChecked" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroceryListItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GroceryListMeal_groceryListId_mealId_key" ON "GroceryListMeal"("groceryListId", "mealId");

-- CreateIndex
CREATE INDEX "GroceryListItem_groceryListId_isChecked_idx" ON "GroceryListItem"("groceryListId", "isChecked");

-- CreateIndex
CREATE INDEX "GroceryListItem_groceryListId_category_idx" ON "GroceryListItem"("groceryListId", "category");

-- AddForeignKey
ALTER TABLE "GroceryListMeal" ADD CONSTRAINT "GroceryListMeal_groceryListId_fkey" FOREIGN KEY ("groceryListId") REFERENCES "GroceryList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryListMeal" ADD CONSTRAINT "GroceryListMeal_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryListItem" ADD CONSTRAINT "GroceryListItem_groceryListId_fkey" FOREIGN KEY ("groceryListId") REFERENCES "GroceryList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryListItem" ADD CONSTRAINT "GroceryListItem_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
