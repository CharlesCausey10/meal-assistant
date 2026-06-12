'use server'

import { prisma } from '@/lib/prisma'
import { getAuthenticatedActionContext } from '@/lib/auth'
import { Prisma, Protein } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { normalizeMealCategories } from './utils/categories'

type MealActionResult = {
    ok: boolean
    error?: string
}

const DUPLICATE_MEAL_NAME_ERROR = 'That household already has a meal with this name.'

function parsePreference(value: string): number | null {
    if (!value) return null

    const preference = parseInt(value, 10)
    return Number.isInteger(preference) && preference >= 1 && preference <= 10 ? preference : null
}

function isUniqueConstraintError(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

async function hasDuplicateMealName(
    householdId: number,
    name: string,
    excludeMealId?: number
) {
    const existingMeal = await prisma.meal.findFirst({
        where: {
            householdId,
            name: {
                equals: name,
                mode: 'insensitive',
            },
            ...(excludeMealId ? { id: { not: excludeMealId } } : {}),
        },
        select: { id: true },
    })

    return existingMeal !== null
}

export async function createMeal(formData: FormData): Promise<MealActionResult> {
    const { household, user } = await getAuthenticatedActionContext()
    const name = String(formData.get('name') || '').trim()
    const proteinValue = formData.get('protein') as string
    const categories = normalizeMealCategories(formData.getAll('categories'))
    const preferenceValue = formData.get('preference') as string
    const recipeUrl = formData.get('recipeUrl') as string
    const ingredientsJson = formData.get('ingredients') as string

    if (!name) {
        return { ok: false, error: 'Meal name is required.' }
    }

    if (categories.length === 0) {
        return { ok: false, error: 'Choose at least one meal window.' }
    }

    const preference = parsePreference(preferenceValue)
    const primaryCategory = categories[0]

    if (await hasDuplicateMealName(household.id, name)) {
        return { ok: false, error: DUPLICATE_MEAL_NAME_ERROR }
    }
    
    let ingredients: Array<{
        id: number
        name: string
        category: string
        quantity: number
        unit: string
    }> = []

    if (ingredientsJson) {
        try {
            ingredients = JSON.parse(ingredientsJson)
        } catch (e) {
            console.error('Failed to parse ingredients', e)
        }
    }

    try {
        const meal = await prisma.meal.create({
            data: {
                householdId: household.id,
                name,
                protein: proteinValue ? (proteinValue as Protein) : null,
                category: primaryCategory,
                recipeUrl: recipeUrl || null,
                categories: {
                    create: categories.map((category) => ({ category })),
                },
                ingredients: {
                    create: ingredients.map(ing => ({
                        ingredientId: ing.id,
                        quantity: ing.quantity,
                        unit: ing.unit,
                    }))
                }
            },
        })

        if (preference !== null) {
            await prisma.mealPreference.create({
                data: {
                    userId: user.id,
                    mealId: meal.id,
                    score: preference,
                },
            })
        }
    } catch (error) {
        if (isUniqueConstraintError(error)) {
            return { ok: false, error: DUPLICATE_MEAL_NAME_ERROR }
        }

        throw error
    }

    revalidatePath('/')
    return { ok: true }
}

export async function deleteMeal(formData: FormData) {
    const { household } = await getAuthenticatedActionContext()
    const id = formData.get('id') as string

    if (!id) return

    const mealId = parseInt(id)
    const meal = await prisma.meal.findFirst({
        where: { id: mealId, householdId: household.id },
        select: { id: true },
    })

    if (!meal) return

    await prisma.$transaction([
        prisma.mealLog.updateMany({
            where: { householdId: household.id, mealId, isActive: true },
            data: { mealId: null },
        }),
        prisma.meal.delete({ where: { id: mealId } }),
    ])

    revalidatePath('/')
}

export async function updateMeal(formData: FormData): Promise<MealActionResult> {
    const { household, user } = await getAuthenticatedActionContext()
    const id = formData.get('id') as string
    const name = String(formData.get('name') || '').trim()
    const proteinValue = formData.get('protein') as string
    const categories = normalizeMealCategories(formData.getAll('categories'))
    const preferenceValue = formData.get('preference') as string
    const recipeUrl = formData.get('recipeUrl') as string
    const ingredientsJson = formData.get('ingredients') as string

    if (!id) {
        return { ok: false, error: 'Meal not found.' }
    }

    if (!name) {
        return { ok: false, error: 'Meal name is required.' }
    }

    if (categories.length === 0) {
        return { ok: false, error: 'Choose at least one meal window.' }
    }

    const preference = parsePreference(preferenceValue)
    const primaryCategory = categories[0]
    const mealId = parseInt(id)
    const meal = await prisma.meal.findFirst({
        where: { id: mealId, householdId: household.id },
        select: { id: true },
    })

    if (!meal) {
        return { ok: false, error: 'Meal not found.' }
    }

    if (await hasDuplicateMealName(household.id, name, mealId)) {
        return { ok: false, error: DUPLICATE_MEAL_NAME_ERROR }
    }

    let ingredients: Array<{
        id: number
        name: string
        category: string
        quantity: number
        unit: string
    }> = []

    if (ingredientsJson) {
        try {
            ingredients = JSON.parse(ingredientsJson)
        } catch (e) {
            console.error('Failed to parse ingredients', e)
        }
    }

    try {
        await prisma.$transaction(async (tx) => {
            await tx.meal.update({
                where: { id: mealId },
                data: {
                    name,
                    protein: proteinValue ? (proteinValue as Protein) : null,
                    category: primaryCategory,
                    recipeUrl: recipeUrl || null,
                    categories: {
                        deleteMany: {},
                        create: categories.map((category) => ({ category })),
                    },
                    ingredients: {
                        deleteMany: {},
                        create: ingredients.map(ing => ({
                            ingredientId: ing.id,
                            quantity: ing.quantity,
                            unit: ing.unit,
                        }))
                    }
                }
            })

            if (preference === null) {
                await tx.mealPreference.deleteMany({
                    where: { userId: user.id, mealId },
                })
                return
            }

            await tx.mealPreference.upsert({
                where: {
                    userId_mealId: {
                        userId: user.id,
                        mealId,
                    },
                },
                update: { score: preference },
                create: {
                    userId: user.id,
                    mealId,
                    score: preference,
                },
            })
        })
    } catch (error) {
        if (isUniqueConstraintError(error)) {
            return { ok: false, error: DUPLICATE_MEAL_NAME_ERROR }
        }

        throw error
    }

    revalidatePath('/')
    return { ok: true }
}
