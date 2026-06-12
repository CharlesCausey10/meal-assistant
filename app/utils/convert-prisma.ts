import type { Meal, MealIngredient, Ingredient, MealPreference, MealCategory } from '@prisma/client'

type MealWithoutPreference = Meal

type MealWithIngredients = MealWithoutPreference & {
    ingredients: Array<MealIngredient & { ingredient: Ingredient }>
    preferences?: Array<Pick<MealPreference, 'score'>>
    categories?: Array<Pick<MealCategory, 'category'>>
}

export type SerializedMealWithIngredients = MealWithoutPreference & {
    preference: number | null
    categories: string[]
    ingredients: Array<Omit<MealIngredient, 'quantity'> & { quantity: number; ingredient: Ingredient }>
    lastCookedAt: string | null
    cookedCount: number
    daysSinceCooked: number | null
}

export type MealCookedStats = {
    lastCookedAt: Date | null
    cookedCount: number
}

function getDaysSince(date: Date): number {
    const now = new Date()
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Converts Prisma Decimal fields to plain numbers for safe serialization
 * to Client Components
 */
export function serializeMeals(
    meals: MealWithIngredients[],
    cookedStatsByMealId: Map<number, MealCookedStats> = new Map()
): SerializedMealWithIngredients[] {
    return meals.map(meal => {
        const cookedStats = cookedStatsByMealId.get(meal.id)
        const lastCookedAt = cookedStats?.lastCookedAt ?? null

        return {
            ...meal,
            preference: meal.preferences?.[0]?.score ?? null,
            preferences: undefined,
            categories: meal.categories?.map((category) => category.category) ?? [meal.category],
            ingredients: meal.ingredients.map(ing => ({
                ...ing,
                quantity: typeof ing.quantity === 'number' ? ing.quantity : ing.quantity.toNumber(),
            })),
            lastCookedAt: lastCookedAt?.toISOString() ?? null,
            cookedCount: cookedStats?.cookedCount ?? 0,
            daysSinceCooked: lastCookedAt ? getDaysSince(lastCookedAt) : null,
        }
    })
}
