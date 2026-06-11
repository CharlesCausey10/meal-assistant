'use server'

import { prisma } from '@/lib/prisma'
import { getAuthenticatedActionContext } from '@/lib/auth'
import { IngredientCategory } from '@prisma/client'
import { revalidatePath } from 'next/cache'

function parseIngredientCategory(category: string): IngredientCategory {
    if (Object.values(IngredientCategory).includes(category as IngredientCategory)) {
        return category as IngredientCategory
    }

    throw new Error('Invalid ingredient category')
}

function isPrismaUniqueError(error: unknown): boolean {
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
    )
}

export async function createIngredient(formData: FormData) {
    const { household } = await getAuthenticatedActionContext()
    const name = formData.get('name') as string
    const category = formData.get('category') as string

    if (!name || !category) {
        throw new Error('Name and category are required')
    }

    try {
        await prisma.ingredient.create({
            data: {
                householdId: household.id,
                name: name.trim(),
                category: parseIngredientCategory(category),
            },
        })
    } catch (error: unknown) {
        if (isPrismaUniqueError(error)) {
            throw new Error(`Ingredient "${name}" already exists`)
        }
        throw error
    }

    revalidatePath('/?tab=ingredients')
}

export async function updateIngredient(formData: FormData) {
    const { household } = await getAuthenticatedActionContext()
    const id = parseInt(formData.get('id') as string, 10)
    const name = formData.get('name') as string
    const category = formData.get('category') as string

    if (!id || !name || !category) {
        throw new Error('ID, name, and category are required')
    }

    const ingredient = await prisma.ingredient.findFirst({
        where: { id, householdId: household.id },
        select: { id: true },
    })

    if (!ingredient) {
        throw new Error('Ingredient not found')
    }

    try {
        await prisma.ingredient.update({
            where: { id },
            data: {
                name: name.trim(),
                category: parseIngredientCategory(category),
            },
        })
    } catch (error: unknown) {
        if (isPrismaUniqueError(error)) {
            throw new Error(`Ingredient "${name}" already exists`)
        }
        throw error
    }

    revalidatePath('/?tab=ingredients')
}

export async function deleteIngredient(formData: FormData) {
    const { household } = await getAuthenticatedActionContext()
    const id = parseInt(formData.get('id') as string, 10)

    if (!id) {
        throw new Error('Ingredient ID is required')
    }

    const deleted = await prisma.ingredient.deleteMany({
        where: { id, householdId: household.id },
    })

    if (deleted.count === 0) {
        throw new Error('Ingredient not found')
    }

    revalidatePath('/?tab=ingredients')
}
