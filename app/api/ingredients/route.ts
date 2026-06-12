import { prisma } from '@/lib/prisma'
import { getOptionalAuthenticatedContext } from '@/lib/auth'
import { IngredientCategory } from '@prisma/client'

function parseIngredientCategory(category: unknown): IngredientCategory | null {
    const value = String(category || '')

    return Object.values(IngredientCategory).includes(value as IngredientCategory)
        ? (value as IngredientCategory)
        : null
}

export async function GET() {
    try {
        const context = await getOptionalAuthenticatedContext()

        if (!context) {
            return Response.json({ error: 'Authentication required' }, { status: 401 })
        }

        const { household } = context
        const ingredients = await prisma.ingredient.findMany({
            where: { householdId: household.id },
            orderBy: { name: 'asc' },
        })
        return Response.json(ingredients)
    } catch (error) {
        console.error('Failed to fetch ingredients:', error)
        return Response.json({ error: 'Failed to fetch ingredients' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const context = await getOptionalAuthenticatedContext()

        if (!context) {
            return Response.json({ error: 'Authentication required' }, { status: 401 })
        }

        const { household } = context
        let body: unknown
        try {
            body = await request.json()
        } catch {
            return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
        }

        if (typeof body !== 'object' || body === null) {
            return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
        }

        const { name, category } = body as Record<string, unknown>
        const trimmedName = String(name || '').trim()
        const parsedCategory = parseIngredientCategory(category)

        if (!trimmedName || !parsedCategory) {
            return Response.json({ error: 'Name and category required' }, { status: 400 })
        }

        const existingIngredient = await prisma.ingredient.findFirst({
            where: {
                householdId: household.id,
                name: {
                    equals: trimmedName,
                    mode: 'insensitive',
                },
            },
        })

        if (existingIngredient) {
            return Response.json(existingIngredient)
        }

        const ingredient = await prisma.ingredient.create({
            data: {
                householdId: household.id,
                name: trimmedName,
                category: parsedCategory,
            },
        })

        return Response.json(ingredient)
    } catch {
        return Response.json({ error: 'Failed to create ingredient' }, { status: 500 })
    }
}
