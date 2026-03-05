import type { Meal, MealIngredient, Ingredient } from '@prisma/client'

type MealWithIngredients = Meal & {
    ingredients: Array<MealIngredient & { ingredient: Ingredient }>
}

export type SerializedMealWithIngredients = Meal & {
    ingredients: Array<Omit<MealIngredient, 'quantity'> & { quantity: number; ingredient: Ingredient }>
}

/**
 * Converts Prisma Decimal fields to plain numbers for safe serialization
 * to Client Components
 */
export function serializeMeals(
    meals: MealWithIngredients[]
): SerializedMealWithIngredients[] {
    return meals.map(meal => ({
        ...meal,
        ingredients: meal.ingredients.map(ing => ({
            ...ing,
            quantity: typeof ing.quantity === 'number' ? ing.quantity : ing.quantity.toNumber(),
        })),
    }))
}
