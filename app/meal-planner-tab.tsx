import { prisma } from '@/lib/prisma'
import { measureAsync } from '@/lib/timing'
import { MealPlannerContent } from './meal-planner-content'
import { serializeMeals } from './utils/convert-prisma'

type CookedMealStatsRow = {
    mealId: number | null
    _max: {
        cookedAt: Date | null
    }
    _count: {
        _all: number
    }
}

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

    const [meals, groceryLists, cookedLogs] = await measureAsync(
        'tab.meals.queries',
        () => Promise.all([
            prisma.meal.findMany({
                where: { householdId },
                include: {
                    ingredients: {
                        include: {
                            ingredient: true,
                        },
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
            prisma.mealLog.groupBy({
                by: ['mealId'],
                where: {
                    householdId,
                    mealId: { not: null },
                },
                _max: {
                    cookedAt: true,
                },
                _count: {
                    _all: true,
                },
            }),
        ]),
        { tab: 'meals' }
    )

    const cookedStatsByMealId = new Map<number, { lastCookedAt: Date | null; cookedCount: number }>()
    for (const row of cookedLogs as CookedMealStatsRow[]) {
        if (row.mealId === null) {
            continue
        }

        cookedStatsByMealId.set(row.mealId, {
            lastCookedAt: row._max.cookedAt,
            cookedCount: row._count._all,
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
