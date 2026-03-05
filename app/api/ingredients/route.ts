import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const ingredients = await prisma.ingredient.findMany({
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
        const body = await request.json()
        const { name, category } = body

        if (!name || !category) {
            return Response.json({ error: 'Name and category required' }, { status: 400 })
        }

        const ingredient = await prisma.ingredient.upsert({
            where: { name },
            update: {},
            create: { name, category },
        })

        return Response.json(ingredient)
    } catch {
        return Response.json({ error: 'Failed to create ingredient' }, { status: 500 })
    }
}
