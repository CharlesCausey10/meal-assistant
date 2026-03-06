import { prisma } from '@/lib/prisma'
import { MealPlannerContent } from './meal-planner-content'
import { serializeMeals } from './utils/convert-prisma'

export async function MealPlannerTab({
    searchParams,
}: {
    searchParams: Promise<{ protein?: string; category?: string; search?: string; tab?: string }>
}) {
    await searchParams

    const [meals, groceryLists] = await Promise.all([
        prisma.meal.findMany({
            include: {
                ingredients: {
                    include: {
                        ingredient: true,
                    }
                }
            },
            orderBy: [
                { preference: 'desc' },
                { createdAt: 'desc' }
            ],
        }),
        prisma.groceryList.findMany({
            select: {
                id: true,
                name: true,
            },
            orderBy: [
                { updatedAt: 'desc' },
                { createdAt: 'desc' },
            ],
        }),
    ])

    // Convert Decimal quantities to numbers for safe serialization to Client Component
    const serializedMeals = serializeMeals(meals)

    return <MealPlannerContent meals={serializedMeals} groceryLists={groceryLists} />
}
