-- Enforce the product invariant that a meal name belongs to only one meal in a
-- household. Names are compared case-insensitively and with surrounding
-- whitespace ignored.
CREATE UNIQUE INDEX "Meal_householdId_normalized_name_key"
ON "Meal" ("householdId", lower(trim("name")))
WHERE "householdId" IS NOT NULL;

CREATE UNIQUE INDEX "Meal_global_normalized_name_key"
ON "Meal" (lower(trim("name")))
WHERE "householdId" IS NULL;
