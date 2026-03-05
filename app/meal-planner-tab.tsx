import { prisma } from '@/lib/prisma'
import { Protein, Category } from '@prisma/client'
import { MealPlannerContent } from './meal-planner-content'
import { serializeMeals } from './utils/convert-prisma'

export async function MealPlannerTab({
    searchParams,
}: {
    searchParams: Promise<{ protein?: string; category?: string; search?: string; tab?: string }>
}) {
    const params = await searchParams

    // Parse comma-separated values for multi-select filters
    const proteins = params.protein?.split(',').filter(Boolean) as Protein[] | undefined
    const categories = params.category?.split(',').filter(Boolean) as Category[] | undefined

    const meals = await prisma.meal.findMany({
        where: {
            ...(proteins && proteins.length > 0 && {
                OR: [
                    { protein: { in: proteins } },
                    { protein: null },
                ],
            }),
            ...(categories && categories.length > 0 && { category: { in: categories } }),
            ...(params.search && { name: { contains: params.search, mode: 'insensitive' } }),
        },
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
    })

    // Convert Decimal quantities to numbers for safe serialization to Client Component
    const serializedMeals = serializeMeals(meals)

    return <MealPlannerContent meals={serializedMeals} />
}
