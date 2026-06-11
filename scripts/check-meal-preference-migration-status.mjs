import 'dotenv/config'
import pg from 'pg'

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })

await client.connect()

try {
  const result = await client.query(`
    SELECT
      (SELECT count(*)::int FROM "MealPreference") AS meal_preferences,
      (SELECT count(*)::int FROM "MealPreference" WHERE "score" BETWEEN 1 AND 10) AS valid_scores,
      EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Meal'
          AND column_name = 'preference'
      ) AS meal_preference_column_exists
  `)

  console.log(JSON.stringify(result.rows[0], null, 2))
} finally {
  await client.end()
}
