'use server'

import { prisma } from '@/lib/prisma'
import { Protein, Category } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function createMeal(formData: FormData) {
    const name = formData.get('name') as string
    const proteinValue = formData.get('protein') as string
    const category = formData.get('category') as Category

    if (!name || !category) return

    await prisma.meal.create({
        data: {
            name,
            protein: proteinValue ? (proteinValue as Protein) : null,
            category,
        }
    })

    revalidatePath('/')
}

export async function deleteMeal(formData: FormData) {
    const id = formData.get('id') as string

    if (!id) return

    await prisma.meal.delete({
        where: { id: parseInt(id) }
    })

    revalidatePath('/')
}
