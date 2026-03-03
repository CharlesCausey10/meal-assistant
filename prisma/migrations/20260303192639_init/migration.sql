-- CreateEnum
CREATE TYPE "Protein" AS ENUM ('CHICKEN_BREAST', 'CHICKEN_THIGHS', 'ROTISSERIE_CHICKEN', 'GROUND_BEEF', 'PORK_BUTT', 'FISH', 'EGGS');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SIDE_STARTER', 'SNACK', 'DESSERT');

-- CreateTable
CREATE TABLE "Meal" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "protein" "Protein",
    "category" "Category" NOT NULL,
    "preference" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealLog" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "protein" "Protein",
    "cookedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MealLog_pkey" PRIMARY KEY ("id")
);
