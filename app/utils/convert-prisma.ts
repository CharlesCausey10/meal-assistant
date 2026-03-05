import type { Meal, MealIngredient, Ingredient, Decimal } from '@prisma/client'

type MealWithIngredients = Meal & {
    ingredients: Array<MealIngredient & { ingredient: Ingredient }>
}

/**
 * Converts Prisma Decimal fields to plain numbers for safe serialization
 * to Client Components
 */
export function serializeMeals(
    meals: MealWithIngredients[]
): Array<Meal & { ingredients: Array<Omit<MealIngredient, 'quantity'> & { quantity: number; ingredient: Ingredient }> }> {
    return meals.map(meal => ({
        ...meal,
        ingredients: meal.ingredients.map(ing => ({
            ...ing,
            quantity: typeof ing.quantity === 'number' ? ing.quantity : ing.quantity.toNumber(),
        })),
    }))
}
