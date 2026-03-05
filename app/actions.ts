'use server'

import { prisma } from '@/lib/prisma'
import { Protein, Category } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function createMeal(formData: FormData) {
    const name = formData.get('name') as string
    const proteinValue = formData.get('protein') as string
    const category = formData.get('category') as Category
    const preferenceValue = formData.get('preference') as string
    const recipeUrl = formData.get('recipeUrl') as string
    const ingredientsJson = formData.get('ingredients') as string

    if (!name || !category) return

    const preference = preferenceValue ? parseInt(preferenceValue) : null
    
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

    // Create meal with ingredients
    await prisma.meal.create({
        data: {
            name,
            protein: proteinValue ? (proteinValue as Protein) : null,
            category,
            preference,
            recipeUrl: recipeUrl || null,
            ingredients: {
                create: ingredients.map(ing => ({
                    ingredientId: ing.id,
                    quantity: ing.quantity,
                    unit: ing.unit,
                }))
            }
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

export async function updateMeal(formData: FormData) {
    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const proteinValue = formData.get('protein') as string
    const category = formData.get('category') as Category
    const preferenceValue = formData.get('preference') as string
    const recipeUrl = formData.get('recipeUrl') as string
    const ingredientsJson = formData.get('ingredients') as string

    if (!id || !name || !category) return

    const preference = preferenceValue ? parseInt(preferenceValue) : null

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

    // Update meal and handle ingredients
    await prisma.meal.update({
        where: { id: parseInt(id) },
        data: {
            name,
            protein: proteinValue ? (proteinValue as Protein) : null,
            category,
            preference,
            recipeUrl: recipeUrl || null,
            ingredients: {
                // Delete existing ingredients
                deleteMany: {},
                // Create new ones
                create: ingredients.map(ing => ({
                    ingredientId: ing.id,
                    quantity: ing.quantity,
                    unit: ing.unit,
                }))
            }
        }
    })

    revalidatePath('/')
}
