-- Collapse any pre-existing multi-household memberships before adding the invariant.
-- Keep the earliest local membership for each user because the original personal household
-- is where existing production/dev data was first scoped.
WITH ranked_memberships AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY "userId"
            ORDER BY "createdAt" ASC, id ASC
        ) AS membership_rank
    FROM "HouseholdMember"
)
DELETE FROM "HouseholdMember"
WHERE id IN (
    SELECT id
    FROM ranked_memberships
    WHERE membership_rank > 1
);

CREATE UNIQUE INDEX "HouseholdMember_userId_key" ON "HouseholdMember"("userId");
