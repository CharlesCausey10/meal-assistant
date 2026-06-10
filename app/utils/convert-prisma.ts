import type { Meal, MealIngredient, Ingredient } from '@prisma/client'

type MealWithIngredients = Meal & {
    ingredients: Array<MealIngredient & { ingredient: Ingredient }>
}

export type SerializedMealWithIngredients = Meal & {
    ingredients: Array<Omit<MealIngredient, 'quantity'> & { quantity: number; ingredient: Ingredient }>
    lastCookedAt: string | null
}

/**
 * Converts Prisma Decimal fields to plain numbers for safe serialization
 * to Client Components
 */
export function serializeMeals(
    meals: MealWithIngredients[],
    lastCookedAtByMealId: Map<number, Date> = new Map()
): SerializedMealWithIngredients[] {
    return meals.map(meal => ({
        ...meal,
        ingredients: meal.ingredients.map(ing => ({
            ...ing,
            quantity: typeof ing.quantity === 'number' ? ing.quantity : ing.quantity.toNumber(),
        })),
        lastCookedAt: lastCookedAtByMealId.get(meal.id)?.toISOString() ?? null,
    }))
}
