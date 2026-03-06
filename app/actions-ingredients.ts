'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createIngredient(formData: FormData) {
    const name = formData.get('name') as string
    const category = formData.get('category') as string

    if (!name || !category) {
        throw new Error('Name and category are required')
    }

    try {
        await prisma.ingredient.create({
            data: {
                name: name.trim(),
                category: category as any, // Safe casting since we validate
            },
        })
    } catch (error: any) {
        if (error.code === 'P2002') {
            throw new Error(`Ingredient "${name}" already exists`)
        }
        throw error
    }

    revalidatePath('/?tab=ingredients')
}

export async function updateIngredient(formData: FormData) {
    const id = parseInt(formData.get('id') as string, 10)
    const name = formData.get('name') as string
    const category = formData.get('category') as string

    if (!id || !name || !category) {
        throw new Error('ID, name, and category are required')
    }

    try {
        await prisma.ingredient.update({
            where: { id },
            data: {
                name: name.trim(),
                category: category as any, // Safe casting since we validate
            },
        })
    } catch (error: any) {
        if (error.code === 'P2002') {
            throw new Error(`Ingredient "${name}" already exists`)
        }
        throw error
    }

    revalidatePath('/?tab=ingredients')
}

export async function deleteIngredient(formData: FormData) {
    const id = parseInt(formData.get('id') as string, 10)

    if (!id) {
        throw new Error('Ingredient ID is required')
    }

    await prisma.ingredient.delete({
        where: { id },
    })

    revalidatePath('/?tab=ingredients')
}
