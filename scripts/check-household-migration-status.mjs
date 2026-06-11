import 'dotenv/config'
import pg from 'pg'

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })

await client.connect()

try {
  const result = await client.query(`
    SELECT
      (SELECT count(*)::int FROM "Household") AS households,
      (SELECT count(*)::int FROM "User") AS users,
      (SELECT count(*)::int FROM "HouseholdMember") AS household_members,
      (SELECT count(*)::int FROM "Meal" WHERE "householdId" IS NOT NULL) AS household_meals,
      (SELECT count(*)::int FROM "Ingredient" WHERE "householdId" IS NOT NULL) AS household_ingredients,
      (SELECT count(*)::int FROM "GroceryList" WHERE "householdId" IS NOT NULL) AS household_grocery_lists,
      (SELECT count(*)::int FROM "MealLog" WHERE "householdId" IS NOT NULL) AS household_meal_logs,
      (SELECT count(*)::int FROM "MealPreference") AS meal_preferences
  `)

  console.log(JSON.stringify(result.rows[0], null, 2))
} finally {
  await client.end()
}
