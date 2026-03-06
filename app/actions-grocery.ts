'use server'

import { prisma } from '@/lib/prisma'
import { IngredientCategory } from '@prisma/client'
import { revalidatePath } from 'next/cache'

function parseIntValue(value: FormDataEntryValue | null): number | null {
    if (!value) return null

    const parsed = parseInt(String(value), 10)
    return Number.isNaN(parsed) ? null : parsed
}

function parseQuantity(value: FormDataEntryValue | null): number | null {
    if (!value) return null

    const parsed = parseFloat(String(value))
    return Number.isNaN(parsed) ? null : parsed
}

function parseCategory(value: FormDataEntryValue | null): IngredientCategory | null {
    if (!value) return null

    const nextValue = String(value)
    return Object.values(IngredientCategory).includes(nextValue as IngredientCategory)
        ? (nextValue as IngredientCategory)
        : null
}

async function touchGroceryList(groceryListId: number) {
    await prisma.groceryList.update({
        where: { id: groceryListId },
        data: { updatedAt: new Date() },
    })
}

function parseMealIds(formData: FormData): number[] {
    return Array.from(
        new Set(
            formData
                .getAll('mealIds')
                .map((value) => parseInt(String(value), 10))
                .filter((value) => !Number.isNaN(value))
        )
    )
}

export async function createGroceryList(formData: FormData) {
    const nameInput = String(formData.get('name') || '').trim()
    const notesInput = String(formData.get('notes') || '').trim()
    const mealIds = parseMealIds(formData)

    if (mealIds.length > 0) {
        const mealIngredients = await prisma.mealIngredient.findMany({
            where: {
                mealId: { in: mealIds },
            },
            include: {
                ingredient: true,
            },
        })

        const aggregated = new Map<string, {
            ingredientId: number
            nameSnapshot: string
            category: IngredientCategory
            quantity: number
            unit: string
        }>()

        for (const mealIngredient of mealIngredients) {
            const normalizedUnit = mealIngredient.unit.trim().toLowerCase()
            const key = `${mealIngredient.ingredientId}|${normalizedUnit}`
            const quantity = parseFloat(String(mealIngredient.quantity))

            if (!aggregated.has(key)) {
                aggregated.set(key, {
                    ingredientId: mealIngredient.ingredientId,
                    nameSnapshot: mealIngredient.ingredient.name,
                    category: mealIngredient.ingredient.category,
                    quantity,
                    unit: mealIngredient.unit.trim(),
                })
                continue
            }

            const existing = aggregated.get(key)!
            existing.quantity += quantity
        }

        const listName = nameInput || `Generated List ${new Date().toLocaleDateString()}`

        await prisma.groceryList.create({
            data: {
                name: listName,
                notes: notesInput || null,
                sourceMeals: {
                    create: mealIds.map((mealId) => ({ mealId })),
                },
                items: {
                    create: Array.from(aggregated.values()).map((item, index) => ({
                        ingredientId: item.ingredientId,
                        nameSnapshot: item.nameSnapshot,
                        category: item.category,
                        quantity: item.quantity,
                        unit: item.unit,
                        sortOrder: index,
                    })),
                },
            },
        })

        revalidatePath('/')
        return
    }

    const name = nameInput || `Grocery List ${new Date().toLocaleDateString()}`

    await prisma.groceryList.create({
        data: {
            name,
            notes: notesInput || null,
        },
    })

    revalidatePath('/')
}

export async function generateGroceryListFromMeals(formData: FormData) {
    const mealIds = parseMealIds(formData)

    if (mealIds.length === 0) {
        return
    }

    await createGroceryList(formData)
}

export async function toggleGroceryItemChecked(formData: FormData) {
    const groceryItemId = parseIntValue(formData.get('groceryItemId'))
    const isChecked = String(formData.get('isChecked')) === 'true'

    if (!groceryItemId) {
        return
    }

    const updated = await prisma.groceryListItem.update({
        where: { id: groceryItemId },
        data: { isChecked },
        select: { groceryListId: true },
    })

    await touchGroceryList(updated.groceryListId)
    revalidatePath('/')
}

export async function updateGroceryItem(formData: FormData) {
    const groceryItemId = parseIntValue(formData.get('groceryItemId'))
    const name = String(formData.get('name') || '').trim()
    const quantity = parseQuantity(formData.get('quantity'))
    const unitInput = String(formData.get('unit') || '').trim()
    const noteInput = String(formData.get('note') || '').trim()
    const category = parseCategory(formData.get('category'))

    if (!groceryItemId || !name) {
        return
    }

    const updated = await prisma.groceryListItem.update({
        where: { id: groceryItemId },
        data: {
            nameSnapshot: name,
            quantity,
            unit: unitInput || null,
            note: noteInput || null,
            category,
        },
        select: { groceryListId: true },
    })

    await touchGroceryList(updated.groceryListId)
    revalidatePath('/')
}

export async function addManualGroceryItem(formData: FormData) {
    const groceryListId = parseIntValue(formData.get('groceryListId'))
    const name = String(formData.get('name') || '').trim()
    const quantity = parseQuantity(formData.get('quantity'))
    const unitInput = String(formData.get('unit') || '').trim()
    const noteInput = String(formData.get('note') || '').trim()
    const category = parseCategory(formData.get('category'))

    if (!groceryListId || !name) {
        return
    }

    const sortOrderRecord = await prisma.groceryListItem.aggregate({
        where: { groceryListId },
        _max: { sortOrder: true },
    })

    const nextSortOrder = (sortOrderRecord._max.sortOrder ?? -1) + 1

    await prisma.groceryListItem.create({
        data: {
            groceryListId,
            nameSnapshot: name,
            category,
            quantity,
            unit: unitInput || null,
            note: noteInput || null,
            sortOrder: nextSortOrder,
            ingredientId: null,
        },
    })

    await touchGroceryList(groceryListId)
    revalidatePath('/')
}

export async function deleteGroceryItem(formData: FormData) {
    const groceryItemId = parseIntValue(formData.get('groceryItemId'))

    if (!groceryItemId) {
        return
    }

    const deleted = await prisma.groceryListItem.delete({
        where: { id: groceryItemId },
        select: { groceryListId: true },
    })

    await touchGroceryList(deleted.groceryListId)
    revalidatePath('/')
}

export async function deleteGroceryList(formData: FormData) {
    const groceryListId = parseIntValue(formData.get('groceryListId'))

    if (!groceryListId) {
        return
    }

    await prisma.groceryList.delete({
        where: { id: groceryListId },
    })

    revalidatePath('/')
}

export async function addMealToGroceryList(formData: FormData) {
    const groceryListId = parseIntValue(formData.get('groceryListId'))
    const mealId = parseIntValue(formData.get('mealId'))

    if (!groceryListId || !mealId) {
        return
    }

    const mealIngredients = await prisma.mealIngredient.findMany({
        where: { mealId },
        include: {
            ingredient: true,
        },
    })

    await prisma.$transaction(async (tx) => {
        await tx.groceryListMeal.upsert({
            where: {
                groceryListId_mealId: {
                    groceryListId,
                    mealId,
                },
            },
            update: {},
            create: {
                groceryListId,
                mealId,
            },
        })

        if (mealIngredients.length === 0) {
            return
        }

        const existingItems = await tx.groceryListItem.findMany({
            where: {
                groceryListId,
                ingredientId: { not: null },
            },
            select: {
                id: true,
                ingredientId: true,
                quantity: true,
                unit: true,
            },
        })

        const existingByKey = new Map<
            string,
            { id: number; quantity: number | null; unit: string | null }
        >()

        for (const item of existingItems) {
            if (!item.ingredientId) {
                continue
            }

            const normalizedUnit = (item.unit || '').trim().toLowerCase()
            const key = `${item.ingredientId}|${normalizedUnit}`
            const quantity = item.quantity
                ? typeof item.quantity === 'number'
                    ? item.quantity
                    : item.quantity.toNumber()
                : null

            existingByKey.set(key, {
                id: item.id,
                quantity,
                unit: item.unit,
            })
        }

        const sortOrderRecord = await tx.groceryListItem.aggregate({
            where: { groceryListId },
            _max: { sortOrder: true },
        })

        let nextSortOrder = (sortOrderRecord._max.sortOrder ?? -1) + 1

        for (const mealIngredient of mealIngredients) {
            const normalizedUnit = mealIngredient.unit.trim().toLowerCase()
            const key = `${mealIngredient.ingredientId}|${normalizedUnit}`
            const quantityToAdd =
                typeof mealIngredient.quantity === 'number'
                    ? mealIngredient.quantity
                    : mealIngredient.quantity.toNumber()

            const existing = existingByKey.get(key)

            if (existing) {
                const currentQuantity = existing.quantity ?? 0

                await tx.groceryListItem.update({
                    where: { id: existing.id },
                    data: {
                        quantity: currentQuantity + quantityToAdd,
                    },
                })

                continue
            }

            await tx.groceryListItem.create({
                data: {
                    groceryListId,
                    ingredientId: mealIngredient.ingredientId,
                    nameSnapshot: mealIngredient.ingredient.name,
                    category: mealIngredient.ingredient.category,
                    quantity: quantityToAdd,
                    unit: mealIngredient.unit.trim(),
                    sortOrder: nextSortOrder,
                },
            })

            nextSortOrder += 1
        }
    })

    await touchGroceryList(groceryListId)
    revalidatePath('/')
}
