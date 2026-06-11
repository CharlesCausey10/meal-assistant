import 'dotenv/config'
import pg from 'pg'

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })

await client.connect()

try {
  const result = await client.query(`
    SELECT
      (SELECT count(*)::int FROM "User") AS users,
      (SELECT count(*)::int FROM "HouseholdMember") AS household_members,
      (SELECT count(*)::int FROM "HouseholdMember" WHERE "role" = 'OWNER') AS owners,
      (SELECT count(*)::int FROM "Meal" WHERE "preference" IS NOT NULL) AS meals_with_preference,
      (SELECT count(*)::int FROM "MealPreference") AS existing_meal_preferences
  `)

  const owners = await client.query(`
    SELECT
      hm."userId",
      u."email",
      hm."householdId",
      h."name" AS household_name,
      count(m."id")::int AS household_meals_with_preference
    FROM "HouseholdMember" hm
    JOIN "User" u ON u."id" = hm."userId"
    JOIN "Household" h ON h."id" = hm."householdId"
    LEFT JOIN "Meal" m ON m."householdId" = hm."householdId" AND m."preference" IS NOT NULL
    WHERE hm."role" = 'OWNER'
    GROUP BY hm."userId", u."email", hm."householdId", h."name"
    ORDER BY hm."userId"
  `)

  console.log(JSON.stringify({
    counts: result.rows[0],
    owners: owners.rows,
  }, null, 2))

  if (owners.rows.length !== 1 || Number(result.rows[0].existing_meal_preferences) > 0) {
    process.exitCode = 1
  }
} finally {
  await client.end()
}
