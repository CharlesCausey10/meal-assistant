'use server'

import { prisma } from '@/lib/prisma'
import { getAuthenticatedActionContext } from '@/lib/auth'
import { Protein } from '@prisma/client'
import { revalidatePath } from 'next/cache'

function parseOptionalMealId(formData: FormData): number | null {
    const raw = formData.get('mealId')
    if (raw === null || raw === '') {
        return null
    }

    const mealId = parseInt(String(raw), 10)
    return Number.isNaN(mealId) ? null : mealId
}

export async function logMeal(formData: FormData) {
    const { household } = await getAuthenticatedActionContext()
    const name = formData.get('name') as string
    const proteinValue = formData.get('protein') as string
    const cookedAtValue = formData.get('cookedAt') as string
    let mealId = parseOptionalMealId(formData)

    if (!name || !cookedAtValue) return

    const cookedAt = new Date(cookedAtValue)

    if (mealId !== null) {
        const meal = await prisma.meal.findFirst({
            where: { id: mealId, householdId: household.id },
            select: { id: true },
        })
        if (!meal) mealId = null
    }

    await prisma.mealLog.create({
        data: {
            householdId: household.id,
            name,
            protein: proteinValue ? (proteinValue as Protein) : null,
            cookedAt,
            mealId,
            isActive: true,
        },
    })

    revalidatePath('/')
}

export async function deleteMealLog(formData: FormData) {
    const { household } = await getAuthenticatedActionContext()
    const id = formData.get('id') as string

    if (!id) return

    await prisma.mealLog.updateMany({
        where: { id: parseInt(id), householdId: household.id },
        data: { isActive: false },
    })

    revalidatePath('/')
}
