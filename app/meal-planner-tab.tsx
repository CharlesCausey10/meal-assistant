import { prisma } from '@/lib/prisma'
import { Protein, Category } from '@prisma/client'
import { MealPlannerContent } from './meal-planner-content'

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
            ...(proteins && proteins.length > 0 && { protein: { in: proteins } }),
            ...(categories && categories.length > 0 && { category: { in: categories } }),
            ...(params.search && { name: { contains: params.search } }),
        },
        orderBy: [
            { preference: 'desc' },
            { createdAt: 'desc' }
        ],
    })

    return <MealPlannerContent meals={meals} />
}
