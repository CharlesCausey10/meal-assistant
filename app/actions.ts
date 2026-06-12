'use server'

import { prisma } from '@/lib/prisma'
import { getAuthenticatedActionContext } from '@/lib/auth'
import { Prisma, Protein } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { normalizeMealCategories } from './utils/categories'
import { isProteinValue } from './utils/protein'

type MealActionResult = {
    ok: boolean
    error?: string
}

const DUPLICATE_MEAL_NAME_ERROR = 'That household already has a meal with this name.'
const INVALID_INGREDIENT_ERROR = 'One or more ingredients are not available in this household.'
const INVALID_PROTEIN_ERROR = 'Choose a valid protein.'
const INVALID_INGREDIENT_PAYLOAD_ERROR = 'Check the meal ingredients and try again.'

type ParsedMealIngredient = {
    id: number
    name: string
    category: string
    quantity: number
    unit: string
}

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

function parseOptionalProtein(value: string): Protein | null | undefined {
    if (!value) {
        return null
    }

    return isProteinValue(value) ? (value as Protein) : undefined
}

function parseMealIngredients(ingredientsJson: string): ParsedMealIngredient[] | null {
    if (!ingredientsJson) {
        return []
    }

    try {
        const parsed = JSON.parse(ingredientsJson)

        if (!Array.isArray(parsed)) {
            return null
        }

        const ingredients = parsed.filter((ingredient): ingredient is ParsedMealIngredient => (
            typeof ingredient === 'object' &&
            ingredient !== null &&
            Number.isInteger(ingredient.id) &&
            typeof ingredient.quantity === 'number' &&
            Number.isFinite(ingredient.quantity) &&
            ingredient.quantity > 0 &&
            typeof ingredient.unit === 'string'
        ))

        return ingredients.length === parsed.length ? ingredients : null
    } catch (error) {
        console.error('Failed to parse ingredients', error)
        return null
    }
}

async function ingredientIdsBelongToHousehold(
    householdId: number,
    ingredientIds: number[]
): Promise<boolean> {
    const uniqueIngredientIds = Array.from(new Set(ingredientIds))

    if (uniqueIngredientIds.length === 0) {
        return true
    }

    const ingredientCount = await prisma.ingredient.count({
        where: {
            id: { in: uniqueIngredientIds },
            householdId,
        },
    })

    return ingredientCount === uniqueIngredientIds.length
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
    const protein = parseOptionalProtein(proteinValue)
    const primaryCategory = categories[0]

    if (protein === undefined) {
        return { ok: false, error: INVALID_PROTEIN_ERROR }
    }

    if (await hasDuplicateMealName(household.id, name)) {
        return { ok: false, error: DUPLICATE_MEAL_NAME_ERROR }
    }
    
    const ingredients = parseMealIngredients(ingredientsJson)

    if (ingredients === null) {
        return { ok: false, error: INVALID_INGREDIENT_PAYLOAD_ERROR }
    }

    if (!(await ingredientIdsBelongToHousehold(household.id, ingredients.map((ingredient) => ingredient.id)))) {
        return { ok: false, error: INVALID_INGREDIENT_ERROR }
    }

    try {
        const meal = await prisma.meal.create({
            data: {
                householdId: household.id,
                name,
                protein,
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

    const mealId = parseInt(id, 10)
    if (Number.isNaN(mealId)) return

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

export async function setMealTaste(formData: FormData) {
    const { household, user } = await getAuthenticatedActionContext()
    const mealId = parseInt(String(formData.get('mealId') || ''), 10)
    const preference = parsePreference(String(formData.get('preference') || ''))

    if (Number.isNaN(mealId) || preference === null) {
        return
    }

    const meal = await prisma.meal.findFirst({
        where: { id: mealId, householdId: household.id },
        select: { id: true },
    })

    if (!meal) {
        return
    }

    await prisma.mealPreference.upsert({
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
    const protein = parseOptionalProtein(proteinValue)
    const primaryCategory = categories[0]
    const mealId = parseInt(id, 10)

    if (protein === undefined) {
        return { ok: false, error: INVALID_PROTEIN_ERROR }
    }

    if (Number.isNaN(mealId)) {
        return { ok: false, error: 'Meal not found.' }
    }

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

    const ingredients = parseMealIngredients(ingredientsJson)

    if (ingredients === null) {
        return { ok: false, error: INVALID_INGREDIENT_PAYLOAD_ERROR }
    }

    if (!(await ingredientIdsBelongToHousehold(household.id, ingredients.map((ingredient) => ingredient.id)))) {
        return { ok: false, error: INVALID_INGREDIENT_ERROR }
    }

    try {
        await prisma.$transaction(async (tx) => {
            await tx.meal.update({
                where: { id: mealId },
                data: {
                    name,
                    protein,
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
