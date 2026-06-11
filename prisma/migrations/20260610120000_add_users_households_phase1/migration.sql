-- Phase 1 of the user/household migration.
-- This adds identity and household tables, links current operational data to
-- a local personal household, and keeps Meal.preference temporarily so the app
-- can continue running before WorkOS user identity is configured.

-- CreateEnum
CREATE TYPE "HouseholdRole" AS ENUM ('OWNER', 'MEMBER');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "workosUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Household" (
    "id" SERIAL NOT NULL,
    "workosOrganizationId" TEXT,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Household_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseholdMember" (
    "id" SERIAL NOT NULL,
    "householdId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" "HouseholdRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HouseholdMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealPreference" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "mealId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealPreference_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Meal" ADD COLUMN "householdId" INTEGER;
ALTER TABLE "Meal" ADD COLUMN "updatedAt" TIMESTAMP(3);
UPDATE "Meal" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "updatedAt" IS NULL;
ALTER TABLE "Meal" ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "Ingredient" ADD COLUMN "householdId" INTEGER;
ALTER TABLE "Ingredient" ADD COLUMN "updatedAt" TIMESTAMP(3);
UPDATE "Ingredient" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "updatedAt" IS NULL;
ALTER TABLE "Ingredient" ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "MealLog" ADD COLUMN "householdId" INTEGER;

-- AlterTable
ALTER TABLE "GroceryList" ADD COLUMN "householdId" INTEGER;

-- Preserve existing personal data by assigning it to one local household.
WITH personal_household AS (
    INSERT INTO "Household" ("name", "createdAt", "updatedAt")
    VALUES ('Personal Household', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING "id"
)
UPDATE "Meal"
SET "householdId" = (SELECT "id" FROM personal_household)
WHERE "householdId" IS NULL;

WITH personal_household AS (
    SELECT "id"
    FROM "Household"
    WHERE "name" = 'Personal Household'
    ORDER BY "id"
    LIMIT 1
)
UPDATE "Ingredient"
SET "householdId" = (SELECT "id" FROM personal_household)
WHERE "householdId" IS NULL;

WITH personal_household AS (
    SELECT "id"
    FROM "Household"
    WHERE "name" = 'Personal Household'
    ORDER BY "id"
    LIMIT 1
)
UPDATE "MealLog"
SET "householdId" = (SELECT "id" FROM personal_household)
WHERE "householdId" IS NULL;

WITH personal_household AS (
    SELECT "id"
    FROM "Household"
    WHERE "name" = 'Personal Household'
    ORDER BY "id"
    LIMIT 1
)
UPDATE "GroceryList"
SET "householdId" = (SELECT "id" FROM personal_household)
WHERE "householdId" IS NULL;

-- Existing app-level unique ingredient names must become household-aware so
-- copied global ingredients can share names with household-owned ingredients.
DROP INDEX IF EXISTS "Ingredient_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "User_workosUserId_key" ON "User"("workosUserId");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Household_workosOrganizationId_key" ON "Household"("workosOrganizationId");
CREATE UNIQUE INDEX "HouseholdMember_householdId_userId_key" ON "HouseholdMember"("householdId", "userId");
CREATE UNIQUE INDEX "MealPreference_userId_mealId_key" ON "MealPreference"("userId", "mealId");
CREATE INDEX "Meal_householdId_idx" ON "Meal"("householdId");
CREATE INDEX "Ingredient_householdId_idx" ON "Ingredient"("householdId");
CREATE INDEX "MealLog_householdId_isActive_cookedAt_idx" ON "MealLog"("householdId", "isActive", "cookedAt");
CREATE INDEX "GroceryList_householdId_idx" ON "GroceryList"("householdId");

CREATE UNIQUE INDEX "ingredient_global_name_unique"
ON "Ingredient"(lower("name"))
WHERE "householdId" IS NULL;

CREATE UNIQUE INDEX "ingredient_household_name_unique"
ON "Ingredient"("householdId", lower("name"))
WHERE "householdId" IS NOT NULL;

-- CreateCheck
ALTER TABLE "MealPreference"
ADD CONSTRAINT "MealPreference_score_check" CHECK ("score" BETWEEN 1 AND 10);

-- AddForeignKey
ALTER TABLE "HouseholdMember" ADD CONSTRAINT "HouseholdMember_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HouseholdMember" ADD CONSTRAINT "HouseholdMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MealPreference" ADD CONSTRAINT "MealPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MealPreference" ADD CONSTRAINT "MealPreference_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Meal" ADD CONSTRAINT "Meal_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MealLog" ADD CONSTRAINT "MealLog_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroceryList" ADD CONSTRAINT "GroceryList_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
