import { prisma } from '@/lib/prisma'
import { measureAsync } from '@/lib/timing'
import { DiscoverContent, type DiscoverMeal } from './discover-content'

export async function DiscoverTab({
    householdId,
    userId,
}: {
    householdId: number
    userId: number
}) {
    const [discoverMeals, householdMeals] = await measureAsync(
        'tab.discover.queries',
        () => Promise.all([
            prisma.meal.findMany({
                where: {
                    householdId: { not: null },
                    household: {
                        discoverableMealsOptIn: true,
                        id: { not: householdId },
                    },
                },
                select: {
                    id: true,
                    name: true,
                    protein: true,
                    category: true,
                    recipeUrl: true,
                    ingredients: {
                        select: {
                            id: true,
                            quantity: true,
                            unit: true,
                            ingredient: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                        orderBy: { id: 'asc' },
                    },
                    categories: {
                        select: { category: true },
                        orderBy: { id: 'asc' },
                    },
                },
                orderBy: [
                    { updatedAt: 'desc' },
                    { createdAt: 'desc' },
                ],
            }),
            prisma.meal.findMany({
                where: { householdId },
                select: { name: true },
            }),
        ]),
        { tab: 'discover' }
    )

    const householdMealNames = new Set(
        householdMeals.map((meal) => meal.name.trim().toLowerCase())
    )
    const uniqueDiscoverMeals = discoverMeals.filter((meal) => {
        return !householdMealNames.has(meal.name.trim().toLowerCase())
    })
    const availableMeals: DiscoverMeal[] = uniqueDiscoverMeals
        .slice(0, 100)
        .map((meal) => ({
            id: meal.id,
            name: meal.name,
            protein: meal.protein,
            category: meal.category,
            categories: meal.categories.map((category) => category.category),
            recipeUrl: meal.recipeUrl,
            ingredients: meal.ingredients.map((mealIngredient) => ({
                id: mealIngredient.id,
                quantity: typeof mealIngredient.quantity === 'number'
                    ? mealIngredient.quantity
                    : mealIngredient.quantity.toNumber(),
                unit: mealIngredient.unit,
                ingredient: mealIngredient.ingredient,
            })),
        }))

    return (
        <DiscoverContent
            key={userId}
            meals={availableMeals}
            userId={userId}
            sharedMealCount={discoverMeals.length}
            duplicateMealCount={discoverMeals.length - uniqueDiscoverMeals.length}
        />
    )
}
