/*
  Warnings:

  - The values [PANTRY,SPICES] on the enum `IngredientCategory` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "IngredientCategory_new" AS ENUM ('PRODUCE', 'MEAT', 'SEAFOOD', 'DAIRY', 'GRAINS_BREAD', 'NUTS_SEEDS', 'BAKING', 'OILS_VINEGARS', 'CONDIMENTS', 'CANNED_GOODS', 'FROZEN', 'SPICES_HERBS', 'SWEETS', 'OTHER');
ALTER TABLE "Ingredient" ALTER COLUMN "category" TYPE "IngredientCategory_new" USING ("category"::text::"IngredientCategory_new");
ALTER TYPE "IngredientCategory" RENAME TO "IngredientCategory_old";
ALTER TYPE "IngredientCategory_new" RENAME TO "IngredientCategory";
DROP TYPE "public"."IngredientCategory_old";
COMMIT;
