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
    'PRODUCE',
    'MEAT',
    'SEAFOOD',
    'DAIRY',
    'DRINKS',
    'GRAINS_BREAD',
    'NUTS_SEEDS',
    'BAKING',
    'OILS_VINEGARS',
    'CONDIMENTS',
    'CANNED_GOODS',
    'FROZEN',
    'SPICES_HERBS',
    'SWEETS',
    'OTHER',
]

const GROUP_ORDER = [...INGREDIENT_CATEGORIES, 'UNCATEGORIZED']

function isPositiveInt(value: string | undefined): boolean {
    if (!value) return false
    const parsed = parseInt(value, 10)
    return !Number.isNaN(parsed) && parsed > 0
}

export async function GroceryTab({
    searchParams,
}: {
    searchParams: Promise<SearchParams>
}) {
    const params = await searchParams

    const [groceryLists, allMeals] = await Promise.all([
        prisma.groceryList.findMany({
            include: {
                sourceMeals: {
                    include: {
                        meal: true,
                    },
                    orderBy: { createdAt: 'asc' },
                },
                items: {
                    orderBy: [
                        { isChecked: 'asc' },
                        { category: 'asc' },
                        { sortOrder: 'asc' },
                        { createdAt: 'asc' },
                    ],
                },
            },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.meal.findMany({
            select: {
                id: true,
                name: true,
                category: true,
                preference: true,
                ingredients: true,
            },
            orderBy: [{ preference: 'desc' }, { createdAt: 'desc' }],
        }),
    ])

    // Filter out meals that don't have any ingredients
    const meals = allMeals.filter((meal) => meal.ingredients.length > 0)

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
