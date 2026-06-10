'use server'

import { prisma } from '@/lib/prisma'
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
    const name = formData.get('name') as string
    const proteinValue = formData.get('protein') as string
    const cookedAtValue = formData.get('cookedAt') as string
    let mealId = parseOptionalMealId(formData)

    if (!name || !cookedAtValue) return

    const cookedAt = new Date(cookedAtValue)

    if (mealId !== null) {
        const meal = await prisma.meal.findUnique({ where: { id: mealId }, select: { id: true } })
        if (!meal) mealId = null
    }

    await prisma.mealLog.create({
        data: {
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
    const id = formData.get('id') as string

    if (!id) return

    await prisma.mealLog.update({
        where: { id: parseInt(id) },
        data: { isActive: false },
    })

    revalidatePath('/')
}
