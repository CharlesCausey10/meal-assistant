import { prisma } from '@/lib/prisma'
import { GroceryListWrapper } from './components/grocery-list-wrapper'
import { formatLabel } from './utils/format'
import type { IngredientCategory } from '@prisma/client'

type SearchParams = {
    protein?: string
    category?: string
    search?: string
    tab?: string
    listId?: string
}

const INGREDIENT_CATEGORIES: IngredientCategory[] = [
    'OTHER',
    'DAIRY',
    'DRINKS',
    'GRAINS_BREAD',
    'SWEETS',
    'SNACKS_CHIPS',
    'NUTS_SEEDS',
    'SPICES_HERBS',
    'BAKING',
    'CANNED_GOODS',
    'OILS_VINEGARS',
    'CONDIMENTS',
    'FROZEN',
    'MEAT',
    'SEAFOOD',
    'PRODUCE',
]

const GROUP_ORDER = [...INGREDIENT_CATEGORIES, 'UNCATEGORIZED']

function isPositiveInt(value: string | undefined): boolean {
    if (!value) return false
    const parsed = parseInt(value, 10)
    return !Number.isNaN(parsed) && parsed > 0
}

export async function GroceryTab({
    searchParams,
    householdId,
    userId,
}: {
    searchParams: Promise<SearchParams>
    householdId: number
    userId: number
}) {
    const params = await searchParams

    const [groceryLists, allMeals] = await Promise.all([
        prisma.groceryList.findMany({
            where: { householdId },
            include: {
                sourceMeals: {
                    include: {
                        meal: true,
                    },
                    orderBy: { createdAt: 'asc' },
                },
                items: {
                    orderBy: [
                        { category: 'asc' },
                        { sortOrder: 'asc' },
                        { createdAt: 'asc' },
                    ],
                },
            },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.meal.findMany({
            where: { householdId },
            select: {
                id: true,
                name: true,
                category: true,
                ingredients: true,
                preferences: {
                    where: { userId },
                    select: { score: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        }),
    ])

    // Filter out meals that don't have any ingredients
    const meals = allMeals
        .filter((meal) => meal.ingredients.length > 0)
        .sort((a, b) => {
            const preferenceDiff = (b.preferences[0]?.score ?? -1) - (a.preferences[0]?.score ?? -1)
            if (preferenceDiff !== 0) return preferenceDiff

            return b.id - a.id
        })

    const selectedListId = isPositiveInt(params.listId) ? parseInt(params.listId!, 10) : null
    const selectedList =
        (selectedListId ? groceryLists.find((list) => list.id === selectedListId) : undefined) ||
        groceryLists[0] ||
        null

    // Serialize Decimal fields for client component
    const serializedSelectedList = selectedList
        ? {
            ...selectedList,
            items: selectedList.items.map((item) => ({
                ...item,
                quantity:
                    item.quantity !== null
                        ? typeof item.quantity === 'number'
                            ? item.quantity
                            : item.quantity.toNumber()
                        : null,
            })),
        }
        : null

    const mealOptions = meals.map((meal) => ({
        id: meal.id,
        name: meal.name,
        categoryLabel: formatLabel(meal.category),
    }))

    // Map to only the fields needed by the sidebar to avoid passing Decimal objects
    const groceryListsForSidebar = groceryLists.map((list) => ({
        id: list.id,
        name: list.name,
    }))

    return (
        <div className="h-full flex flex-col md:flex-row md:gap-6 overflow-hidden">
            <GroceryListWrapper
                mealOptions={mealOptions}
                groceryListsForSidebar={groceryListsForSidebar}
                serializedSelectedList={serializedSelectedList}
                ingredientCategories={INGREDIENT_CATEGORIES}
                groupOrder={GROUP_ORDER}
            />
        </div>
    )
}
