'use server'

import { prisma } from '@/lib/prisma'
import { getAuthenticatedActionContext } from '@/lib/auth'
import { Protein } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { isProteinValue } from './utils/protein'

function parseOptionalMealId(formData: FormData): number | null {
    const raw = formData.get('mealId')
    if (raw === null || raw === '') {
        return null
    }

    const mealId = parseInt(String(raw), 10)
    return Number.isNaN(mealId) ? null : mealId
}

function parseOptionalProtein(value: string): Protein | null | undefined {
    if (!value) {
        return null
    }

    return isProteinValue(value) ? (value as Protein) : undefined
}

export async function logMeal(formData: FormData) {
    const { household } = await getAuthenticatedActionContext()
    const name = formData.get('name') as string
    const proteinValue = formData.get('protein') as string
    const cookedAtValue = formData.get('cookedAt') as string
    let mealId = parseOptionalMealId(formData)

    if (!name || !cookedAtValue) return

    const cookedAt = new Date(cookedAtValue)
    const protein = parseOptionalProtein(proteinValue)

    if (Number.isNaN(cookedAt.getTime()) || protein === undefined) {
        return
    }

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
            protein,
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
    const mealLogId = parseInt(id, 10)

    if (Number.isNaN(mealLogId)) return

    await prisma.mealLog.updateMany({
        where: { id: mealLogId, householdId: household.id },
        data: { isActive: false },
    })

    revalidatePath('/')
}
