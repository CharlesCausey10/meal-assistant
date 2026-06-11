import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const user = await prisma.user.findFirst({
  include: {
    memberships: {
      include: { household: true },
      take: 1,
    },
  },
})

if (!user || user.memberships.length === 0) {
  throw new Error('No user membership found')
}

const householdId = user.memberships[0].householdId
const userId = user.id

const meals = await prisma.meal.findMany({
  where: { householdId },
  include: {
    ingredients: {
      include: {
        ingredient: true,
      },
    },
    preferences: {
      where: { userId },
      select: { score: true },
    },
  },
  orderBy: { createdAt: 'desc' },
})

console.log(JSON.stringify({
  householdId,
  userId,
  mealCount: meals.length,
  firstMeal: meals[0]
    ? {
      id: meals[0].id,
      name: meals[0].name,
      preference: meals[0].preferences[0]?.score ?? null,
      ingredientCount: meals[0].ingredients.length,
    }
    : null,
}, null, 2))

await prisma.$disconnect()
