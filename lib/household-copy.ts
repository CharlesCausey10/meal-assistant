import { prisma } from './prisma'

function ingredientKey(name: string, category: string) {
    return `${category}\u0000${name.trim().toLowerCase()}`
}

export async function copyGlobalIngredientsToHousehold(householdId: number) {
    const globalIngredients = await prisma.ingredient.findMany({
        where: { householdId: null },
        select: {
            name: true,
            category: true,
        },
        orderBy: { id: 'asc' },
    })

    if (globalIngredients.length === 0) {
        return
    }

    await prisma.ingredient.createMany({
        data: globalIngredients.map((ingredient) => ({
            householdId,
            name: ingredient.name,
            category: ingredient.category,
        })),
        skipDuplicates: true,
    })
}

export async function copyMealsAndIngredientsToHousehold(
    sourceHouseholdId: number | null,
    targetHouseholdId: number,
    userId: number,
    mealIds?: number[]
) {
    const [sourceIngredients, sourceMeals] = await Promise.all([
        mealIds
            ? Promise.resolve([])
            : prisma.ingredient.findMany({
                where: { householdId: sourceHouseholdId },
                orderBy: { id: 'asc' },
            }),
        prisma.meal.findMany({
            where: {
                householdId: sourceHouseholdId,
                ...(mealIds ? { id: { in: mealIds } } : {}),
            },
            include: {
                ingredients: {
                    include: { ingredient: true },
                },
                categories: {
                    select: { category: true },
                    orderBy: { id: 'asc' },
                },
                preferences: {
                    where: { userId },
                },
            },
            orderBy: { id: 'asc' },
        }),
    ])

    const sourceIngredientKeyById = new Map<number, string>()
    const ingredientsToCopy = new Map<string, { name: string, category: typeof sourceIngredients[number]['category'] }>()

    for (const ingredient of sourceIngredients) {
        const key = ingredientKey(ingredient.name, ingredient.category)
        sourceIngredientKeyById.set(ingredient.id, key)
        ingredientsToCopy.set(key, {
            name: ingredient.name,
            category: ingredient.category,
        })
    }

    for (const meal of sourceMeals) {
        for (const mealIngredient of meal.ingredients) {
            const key = ingredientKey(mealIngredient.ingredient.name, mealIngredient.ingredient.category)
            sourceIngredientKeyById.set(mealIngredient.ingredientId, key)
            ingredientsToCopy.set(key, {
                name: mealIngredient.ingredient.name,
                category: mealIngredient.ingredient.category,
            })
        }
    }

    if (ingredientsToCopy.size > 0) {
        await prisma.ingredient.createMany({
            data: Array.from(ingredientsToCopy.values()).map((ingredient) => ({
                householdId: targetHouseholdId,
                name: ingredient.name,
                category: ingredient.category,
            })),
            skipDuplicates: true,
        })
    }

    const targetIngredients = await prisma.ingredient.findMany({
        where: { householdId: targetHouseholdId },
        select: {
            id: true,
            name: true,
            category: true,
        },
    })
    const targetIngredientIdByKey = new Map(
        targetIngredients.map((ingredient) => [
            ingredientKey(ingredient.name, ingredient.category),
            ingredient.id,
        ])
    )
    const ingredientIdMap = new Map<number, number>()

    for (const [sourceIngredientId, key] of sourceIngredientKeyById) {
        const targetIngredientId = targetIngredientIdByKey.get(key)
        if (!targetIngredientId) {
            throw new Error('Could not copy all meal ingredients.')
        }
        ingredientIdMap.set(sourceIngredientId, targetIngredientId)
    }

    const mealIdMap = new Map<number, number>()
    const mealIngredientRows = []
    const mealPreferenceRows = []

    for (const meal of sourceMeals) {
        const copiedMeal = await prisma.meal.create({
            data: {
                householdId: targetHouseholdId,
                name: meal.name,
                protein: meal.protein,
                category: meal.category,
                categories: {
                    create: (meal.categories.length > 0
                        ? meal.categories.map((mealCategory) => mealCategory.category)
                        : [meal.category]
                    ).map((category) => ({ category })),
                },
                notes: meal.notes,
                recipeUrl: meal.recipeUrl,
            },
            select: { id: true },
        })
        mealIdMap.set(meal.id, copiedMeal.id)

        for (const mealIngredient of meal.ingredients) {
            const copiedIngredientId = ingredientIdMap.get(mealIngredient.ingredientId)
            if (!copiedIngredientId) {
                throw new Error(`Could not copy ingredient for ${meal.name}.`)
            }

            mealIngredientRows.push({
                mealId: copiedMeal.id,
                ingredientId: copiedIngredientId,
                quantity: mealIngredient.quantity,
                unit: mealIngredient.unit,
            })
        }

        const preference = meal.preferences[0]
        if (preference) {
            mealPreferenceRows.push({
                userId,
                mealId: copiedMeal.id,
                score: preference.score,
            })
        }
    }

    await prisma.$transaction([
        ...(mealIngredientRows.length > 0
            ? [prisma.mealIngredient.createMany({ data: mealIngredientRows })]
            : []),
        ...(mealPreferenceRows.length > 0
            ? [prisma.mealPreference.createMany({ data: mealPreferenceRows })]
            : []),
    ])

    return mealIdMap
}

export async function copyMealLogsToHousehold(
    sourceHouseholdId: number,
    targetHouseholdId: number,
    mealIdMap: Map<number, number>
) {
    const sourceMealLogs = await prisma.mealLog.findMany({
        where: { householdId: sourceHouseholdId },
        orderBy: { id: 'asc' },
    })

    if (sourceMealLogs.length === 0) {
        return
    }

    await prisma.mealLog.createMany({
        data: sourceMealLogs.map((mealLog) => ({
            householdId: targetHouseholdId,
            name: mealLog.name,
            protein: mealLog.protein,
            cookedAt: mealLog.cookedAt,
            mealId: mealLog.mealId ? mealIdMap.get(mealLog.mealId) ?? null : null,
            isActive: mealLog.isActive,
            createdAt: mealLog.createdAt,
        })),
    })
}
