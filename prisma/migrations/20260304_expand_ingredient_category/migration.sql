-- AlterEnum
-- This migration updates IngredientCategory to include all new values

-- Create new enum with all current values
CREATE TYPE "IngredientCategory_new" AS ENUM ('PRODUCE', 'MEAT', 'SEAFOOD', 'DAIRY', 'GRAINS_BREAD', 'NUTS_SEEDS', 'BAKING', 'OILS_VINEGARS', 'CONDIMENTS', 'CANNED_GOODS', 'FROZEN', 'SPICES_HERBS', 'SWEETS', 'OTHER');

-- Change the column type to the new enum
ALTER TABLE "Ingredient" ALTER COLUMN "category" TYPE "IngredientCategory_new" USING (
  CASE 
    WHEN "category"::text = 'PANTRY' THEN 'BAKING'::"IngredientCategory_new"
    WHEN "category"::text = 'SPICES' THEN 'SPICES_HERBS'::"IngredientCategory_new"
    ELSE "category"::text::"IngredientCategory_new"
  END
);

-- Drop the old enum
DROP TYPE "IngredientCategory";

-- Rename the new enum to the original name
ALTER TYPE "IngredientCategory_new" RENAME TO "IngredientCategory";
