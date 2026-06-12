import { prisma } from '@/lib/prisma'
import { measureAsync } from '@/lib/timing'
import { GroceryListWrapper } from './components/grocery-list-wrapper'
import { formatLabel } from './utils/format'
import type { IngredientCategory } from '@prisma/client'
import { getMealCategoriesForDisplay } from './utils/categories'

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

    const [groceryListsForSidebar, allMeals] = await measureAsync(
        'tab.grocery.baseQueries',
        () => Promise.all([
            prisma.groceryList.findMany({
                where: { householdId },
                select: {
                    id: true,
                    name: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.meal.findMany({
                where: { householdId },
                select: {
                    id: true,
                    name: true,
                    category: true,
                    categories: {
                        select: { category: true },
                        orderBy: { id: 'asc' },
                    },
                    _count: {
                        select: { ingredients: true },
                    },
                    preferences: {
                        where: { userId },
                        select: { score: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
        ]),
        { tab: 'grocery' }
    )

    // Filter out meals that don't have any ingredients
    const meals = allMeals
        .filter((meal) => meal._count.ingredients > 0)
        .sort((a, b) => {
            const preferenceDiff = (b.preferences[0]?.score ?? -1) - (a.preferences[0]?.score ?? -1)
            if (preferenceDiff !== 0) return preferenceDiff

            return b.id - a.id
        })

    const requestedListId = isPositiveInt(params.listId) ? parseInt(params.listId!, 10) : null
    const selectedListId = requestedListId && groceryListsForSidebar.some((list) => list.id === requestedListId)
        ? requestedListId
        : groceryListsForSidebar[0]?.id ?? null

    const selectedList = selectedListId
        ? await measureAsync(
            'tab.grocery.selectedListQuery',
            () => prisma.groceryList.findFirst({
                where: {
                    id: selectedListId,
                    householdId,
                },
                select: {
                    id: true,
                    name: true,
                    notes: true,
                    sourceMeals: {
                        select: {
                            id: true,
                            meal: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                        orderBy: { createdAt: 'asc' },
                    },
                    items: {
                        select: {
                            id: true,
                            ingredientId: true,
                            nameSnapshot: true,
                            quantity: true,
                            unit: true,
                            category: true,
                            note: true,
                            isChecked: true,
                            sortOrder: true,
                            createdAt: true,
                        },
                        orderBy: [
                            { category: 'asc' },
                            { sortOrder: 'asc' },
                            { createdAt: 'asc' },
                        ],
                    },
                },
            }),
            { tab: 'grocery' }
        )
        : null

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
        categoryLabel: getMealCategoriesForDisplay({
            category: meal.category,
            categories: meal.categories.map((category) => category.category),
        }).map(formatLabel).join(' / '),
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
