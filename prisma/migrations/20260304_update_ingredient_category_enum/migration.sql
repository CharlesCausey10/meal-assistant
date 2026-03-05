-- AlterEnum
-- This migration adds two new variants to the `IngredientCategory` enum.
-- It renamesthe old enum to a temporary name and creates the new one.

-- Create new enum with all values
CREATE TYPE "IngredientCategory_new" AS ENUM ('PRODUCE', 'MEAT', 'DAIRY', 'FROZEN', 'PANTRY', 'SPICES', 'OTHER');

-- Change the column type to the new enum
ALTER TABLE "Ingredient" ALTER COLUMN "category" TYPE "IngredientCategory_new" USING (
  CASE 
    WHEN "category"::text = 'PROTEIN' THEN 'MEAT'::"IngredientCategory_new"
    ELSE "category"::text::"IngredientCategory_new"
  END
);

-- Drop the old enum
DROP TYPE "IngredientCategory";

-- Rename the new enum to the original name
ALTER TYPE "IngredientCategory_new" RENAME TO "IngredientCategory";
