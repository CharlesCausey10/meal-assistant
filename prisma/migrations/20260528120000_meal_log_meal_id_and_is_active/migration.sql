-- AlterTable
ALTER TABLE "MealLog" ADD COLUMN "mealId" INTEGER,
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AddForeignKey
ALTER TABLE "MealLog" ADD CONSTRAINT "MealLog_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "MealLog_mealId_isActive_cookedAt_idx" ON "MealLog"("mealId", "isActive", "cookedAt");
