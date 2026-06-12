-- Add multi-category meal tags while keeping Meal.category as the primary
-- compatibility category until duplicate meals can be merged safely.
CREATE TABLE "MealCategory" (
    "id" SERIAL NOT NULL,
    "mealId" INTEGER NOT NULL,
    "category" "Category" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MealCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MealCategory_mealId_category_key" ON "MealCategory"("mealId", "category");
CREATE INDEX "MealCategory_category_idx" ON "MealCategory"("category");

ALTER TABLE "MealCategory"
ADD CONSTRAINT "MealCategory_mealId_fkey"
FOREIGN KEY ("mealId") REFERENCES "Meal"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "MealCategory" ("mealId", "category")
SELECT "id", "category"
FROM "Meal"
ON CONFLICT ("mealId", "category") DO NOTHING;
