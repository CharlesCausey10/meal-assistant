'use server'

import { revalidatePath } from 'next/cache'
import { getAuthenticatedActionContext } from '@/lib/auth'
import { copyMealsAndIngredientsToHousehold } from '@/lib/household-copy'
import { prisma } from '@/lib/prisma'

export async function copyDiscoveredMeal(mealId: number) {
    const { household, user } = await getAuthenticatedActionContext()

    if (!Number.isInteger(mealId) || mealId <= 0) {
        return { ok: false, message: 'Choose a meal to copy.' }
    }

    const sourceMeal = await prisma.meal.findFirst({
        where: {
            id: mealId,
            householdId: { not: null },
            household: {
                discoverableMealsOptIn: true,
            },
        },
        select: {
            id: true,
            householdId: true,
            name: true,
        },
    })

    if (!sourceMeal?.householdId || sourceMeal.householdId === household.id) {
        return { ok: false, message: 'This meal is not available in Discover.' }
    }

    const existingMeal = await prisma.meal.findFirst({
        where: {
            householdId: household.id,
            name: {
                equals: sourceMeal.name,
                mode: 'insensitive',
            },
        },
        select: { id: true },
    })

    if (existingMeal) {
        return { ok: true, message: 'You already have that meal.' }
    }

    await copyMealsAndIngredientsToHousehold(
        sourceMeal.householdId,
        household.id,
        user.id,
        [sourceMeal.id]
    )

    revalidatePath('/')

    return { ok: true, message: `Copied ${sourceMeal.name}.` }
}
