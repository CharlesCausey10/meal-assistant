'use server'

import { prisma } from '@/lib/prisma'
import { Protein } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function logMeal(formData: FormData) {
    const name = formData.get('name') as string
    const proteinValue = formData.get('protein') as string
    const cookedAtValue = formData.get('cookedAt') as string

    if (!name || !cookedAtValue) return

    const cookedAt = new Date(cookedAtValue)

    await prisma.mealLog.create({
        data: {
            name,
            protein: proteinValue ? (proteinValue as Protein) : null,
            cookedAt,
        }
    })

    revalidatePath('/')
}

export async function deleteMealLog(formData: FormData) {
    const id = formData.get('id') as string

    if (!id) return

    await prisma.mealLog.delete({
        where: { id: parseInt(id) }
    })

    revalidatePath('/')
}
