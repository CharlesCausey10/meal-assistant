import 'dotenv/config'
import pg from 'pg'

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })

await client.connect()

try {
  const mealDuplicates = await client.query(`
    SELECT lower(name) AS normalized_name, count(*)::int AS count
    FROM "Meal"
    GROUP BY lower(name)
    HAVING count(*) > 1
    ORDER BY count DESC, normalized_name
  `)
  const ingredientDuplicates = await client.query(`
    SELECT lower(name) AS normalized_name, count(*)::int AS count
    FROM "Ingredient"
    GROUP BY lower(name)
    HAVING count(*) > 1
    ORDER BY count DESC, normalized_name
  `)
  const counts = await client.query(`
    SELECT
      (SELECT count(*)::int FROM "Meal") AS meals,
      (SELECT count(*)::int FROM "Ingredient") AS ingredients,
      (SELECT count(*)::int FROM "MealLog") AS meal_logs,
      (SELECT count(*)::int FROM "GroceryList") AS grocery_lists
  `)

  const result = {
    counts: counts.rows[0],
    mealDuplicates: mealDuplicates.rows,
    ingredientDuplicates: ingredientDuplicates.rows,
  }

  console.log(JSON.stringify(result, null, 2))

  if (mealDuplicates.rows.length > 0 || ingredientDuplicates.rows.length > 0) {
    process.exitCode = 1
  }
} finally {
  await client.end()
}
