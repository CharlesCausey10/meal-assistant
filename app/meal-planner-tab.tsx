import { prisma } from '@/lib/prisma'
import { MealPlannerContent } from './meal-planner-content'
import { serializeMeals } from './utils/convert-prisma'

export async function MealPlannerTab({
    searchParams,
}: {
    searchParams: Promise<{ protein?: string; category?: string; search?: string; tab?: string }>
}) {
    await searchParams

    const [meals, groceryLists, cookedLogs] = await Promise.all([
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
        prisma.mealLog.findMany({
            where: {
                isActive: true,
                mealId: { not: null },
            },
            select: {
                mealId: true,
                cookedAt: true,
            },
            orderBy: { cookedAt: 'desc' },
        }),
    ])

    const lastCookedAtByMealId = new Map<number, Date>()
    for (const log of cookedLogs) {
        if (log.mealId !== null && !lastCookedAtByMealId.has(log.mealId)) {
            lastCookedAtByMealId.set(log.mealId, log.cookedAt)
        }
    }

    // Convert Decimal quantities to numbers for safe serialization to Client Component
    const serializedMeals = serializeMeals(meals, lastCookedAtByMealId)

    return <MealPlannerContent meals={serializedMeals} groceryLists={groceryLists} />
}
