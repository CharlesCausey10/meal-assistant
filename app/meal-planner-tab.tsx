import { prisma } from '@/lib/prisma'
import { MealPlannerContent } from './meal-planner-content'
import { serializeMeals } from './utils/convert-prisma'

export async function MealPlannerTab({
    searchParams,
    householdId,
    userId,
}: {
    searchParams: Promise<{ protein?: string; category?: string; search?: string; tab?: string }>
    householdId: number
    userId: number
}) {
    await searchParams

    const [meals, groceryLists, cookedLogs] = await Promise.all([
        prisma.meal.findMany({
            where: { householdId },
            include: {
                ingredients: {
                    include: {
                        ingredient: true,
                    }
                },
                preferences: {
                    where: { userId },
                    select: { score: true },
                },
                categories: {
                    select: { category: true },
                    orderBy: { id: 'asc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.groceryList.findMany({
            where: { householdId },
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
                householdId,
                mealId: { not: null },
            },
            select: {
                mealId: true,
                cookedAt: true,
            },
            orderBy: { cookedAt: 'desc' },
        }),
    ])

    const cookedStatsByMealId = new Map<number, { lastCookedAt: Date | null; cookedCount: number }>()
    for (const log of cookedLogs) {
        if (log.mealId === null) {
            continue
        }

        const current = cookedStatsByMealId.get(log.mealId) ?? {
            lastCookedAt: null,
            cookedCount: 0,
        }

        cookedStatsByMealId.set(log.mealId, {
            lastCookedAt:
                current.lastCookedAt === null || log.cookedAt > current.lastCookedAt
                    ? log.cookedAt
                    : current.lastCookedAt,
            cookedCount: current.cookedCount + 1,
        })
    }

    // Convert Decimal quantities to numbers for safe serialization to Client Component
    const serializedMeals = serializeMeals(meals, cookedStatsByMealId).sort((a, b) => {
        const preferenceDiff = (b.preference ?? -1) - (a.preference ?? -1)
        if (preferenceDiff !== 0) return preferenceDiff

        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return <MealPlannerContent meals={serializedMeals} groceryLists={groceryLists} />
}
