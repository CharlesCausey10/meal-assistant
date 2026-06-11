-- Move meal preference from the shared Meal row to the owning household user's
-- per-user MealPreference row. This migration assumes the Phase 1 bootstrap
-- state where each existing household has an owner membership.

INSERT INTO "MealPreference" ("userId", "mealId", "score", "createdAt", "updatedAt")
SELECT
    owner_membership."userId",
    meal."id",
    meal."preference",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Meal" meal
JOIN LATERAL (
    SELECT hm."userId"
    FROM "HouseholdMember" hm
    WHERE hm."householdId" = meal."householdId"
      AND hm."role" = 'OWNER'
    ORDER BY hm."id"
    LIMIT 1
) owner_membership ON true
WHERE meal."preference" IS NOT NULL
ON CONFLICT ("userId", "mealId") DO UPDATE
SET "score" = EXCLUDED."score",
    "updatedAt" = CURRENT_TIMESTAMP;

ALTER TABLE "Meal" DROP COLUMN "preference";
