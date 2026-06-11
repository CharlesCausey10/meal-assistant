import { prisma } from '@/lib/prisma'
import { getAuthenticatedContext } from '@/lib/auth'

export async function GET() {
    try {
        const { household } = await getAuthenticatedContext()
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
        const { household } = await getAuthenticatedContext()
        const body = await request.json()
        const { name, category } = body
        const trimmedName = String(name || '').trim()

        if (!trimmedName || !category) {
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
                category,
            },
        })

        return Response.json(ingredient)
    } catch {
        return Response.json({ error: 'Failed to create ingredient' }, { status: 500 })
    }
}
