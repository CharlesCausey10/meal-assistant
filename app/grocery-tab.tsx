import {
    addManualGroceryItem,
    createGroceryList,
    deleteGroceryItem,
    deleteGroceryList,
    toggleGroceryItemChecked,
    updateGroceryItem,
} from './actions-grocery'
import { prisma } from '@/lib/prisma'
import { MealSelector } from './components/meal-selector'
import type { IngredientCategory } from '@prisma/client'

type SearchParams = {
    protein?: string
    category?: string
    search?: string
    tab?: string
    listId?: string
    hideChecked?: string
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

function formatLabel(value: string): string {
    if (value === 'GRAINS_BREAD') return 'Grains & Bread'
    if (value === 'NUTS_SEEDS') return 'Nuts & Seeds'
    if (value === 'OILS_VINEGARS') return 'Oils & Vinegars'
    if (value === 'CANNED_GOODS') return 'Canned Goods'
    if (value === 'SPICES_HERBS') return 'Spices & Herbs'
    if (value === 'UNCATEGORIZED') return 'Uncategorized'
    return value
        .toLowerCase()
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}

function isPositiveInt(value: string | undefined): boolean {
    if (!value) return false
    const parsed = parseInt(value, 10)
    return !Number.isNaN(parsed) && parsed > 0
}

function buildPageUrl(currentParams: SearchParams, updates: Record<string, string | null>) {
    const params = new URLSearchParams()

    for (const [key, value] of Object.entries(currentParams)) {
        if (value) {
            params.set(key, value)
        }
    }

    for (const [key, value] of Object.entries(updates)) {
        if (value === null) {
            params.delete(key)
        } else {
            params.set(key, value)
        }
    }

    const query = params.toString()
    return query ? `/?${query}` : '/'
}

export async function GroceryTab({
    searchParams,
}: {
    searchParams: Promise<SearchParams>
}) {
    const params = await searchParams

    const [groceryLists, meals] = await Promise.all([
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
            },
            orderBy: [{ preference: 'desc' }, { createdAt: 'desc' }],
        }),
    ])

    const hideChecked = params.hideChecked === '1'
    const selectedListId = isPositiveInt(params.listId) ? parseInt(params.listId!, 10) : null
    const selectedList =
        (selectedListId ? groceryLists.find((list) => list.id === selectedListId) : undefined) ||
        groceryLists[0] ||
        null

    const visibleItems = selectedList
        ? selectedList.items.filter((item) => (hideChecked ? !item.isChecked : true))
        : []

    const groupedItems = visibleItems.reduce<Record<string, typeof visibleItems>>((groups, item) => {
        const key = item.category || 'UNCATEGORIZED'

        if (!groups[key]) {
            groups[key] = []
        }

        groups[key].push(item)
        return groups
    }, {})

    const groupedEntries = Object.entries(groupedItems).sort((a, b) => {
        const indexA = GROUP_ORDER.indexOf(a[0] as typeof GROUP_ORDER[number])
        const indexB = GROUP_ORDER.indexOf(b[0] as typeof GROUP_ORDER[number])

        const safeIndexA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA
        const safeIndexB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB

        return safeIndexA - safeIndexB
    })

    const mealOptions = meals.map((meal) => ({
        id: meal.id,
        name: meal.name,
        categoryLabel: formatLabel(meal.category),
    }))

    return (
        <div className="h-full flex flex-col md:flex-row md:gap-6 overflow-hidden">
            <div className="md:block md:w-120 shrink-0 overflow-y-auto">
                <div className="space-y-4 p-4">
                    <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-purple-500/30 space-y-3">
                        <h2 className="text-lg font-semibold text-purple-200">Create Grocery List</h2>
                        <form action={createGroceryList} className="space-y-3">
                            <input
                                type="text"
                                name="name"
                                placeholder="Weekly Grocery List"
                                className="w-full border border-slate-600 focus:border-purple-400 focus:outline-none p-3 rounded-lg bg-slate-900/80 text-slate-100"
                            />

                            <MealSelector meals={mealOptions} />

                            <button
                                type="submit"
                                className="w-full bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
                            >
                                Create Grocery List
                            </button>
                        </form>
                    </div>

                    <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-purple-500/30 space-y-3">
                        <h2 className="text-lg font-semibold text-purple-200">Saved Lists</h2>
                        {groceryLists.length === 0 ? (
                            <p className="text-sm text-slate-400">No grocery lists yet.</p>
                        ) : (
                            <ul className="space-y-2">
                                {groceryLists.map((list) => {
                                    const isActive = selectedList?.id === list.id
                                    const listUrl = buildPageUrl(params, {
                                        tab: 'grocery',
                                        listId: String(list.id),
                                    })

                                    return (
                                        <li key={list.id} className="flex items-center gap-2">
                                            <a
                                                href={listUrl}
                                                className={`flex-1 rounded-lg px-3 py-2 text-sm border transition-colors ${
                                                    isActive
                                                        ? 'border-purple-400 text-purple-200 bg-purple-500/10'
                                                        : 'border-slate-700 text-slate-300 hover:border-purple-500/50'
                                                }`}
                                            >
                                                {list.name}
                                            </a>
                                            <form action={deleteGroceryList}>
                                                <input type="hidden" name="groceryListId" value={list.id} />
                                                <button
                                                    type="submit"
                                                    className="text-rose-400 hover:text-rose-300 hover:bg-slate-700/50 rounded-lg p-2 transition-colors"
                                                    aria-label="Delete grocery list"
                                                >
                                                    Delete
                                                </button>
                                            </form>
                                        </li>
                                    )
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {!selectedList ? (
                    <div className="h-full grid place-items-center text-slate-400">Select or create a grocery list.</div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-slate-800/60 border border-purple-500/30 rounded-xl p-4 space-y-2">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="text-xl font-semibold text-slate-100">{selectedList.name}</h2>
                                <a
                                    href={
                                        hideChecked
                                            ? buildPageUrl(params, { tab: 'grocery', hideChecked: null })
                                            : buildPageUrl(params, { tab: 'grocery', hideChecked: '1' })
                                    }
                                    className="text-sm text-purple-300 hover:text-purple-200"
                                >
                                    {hideChecked ? 'Show checked items' : 'Hide checked items'}
                                </a>
                            </div>
                            {selectedList.notes && (
                                <p className="text-sm text-slate-300">{selectedList.notes}</p>
                            )}
                            {selectedList.sourceMeals.length > 0 && (
                                <div className="text-sm text-slate-300 space-y-1">
                                    <p className="text-slate-400">Generated from meals:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedList.sourceMeals.map((source) => (
                                            <span
                                                key={source.id}
                                                className="text-xs bg-slate-700 text-slate-200 px-2 py-1 rounded-full"
                                            >
                                                {source.meal.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-slate-800/60 border border-purple-500/30 rounded-xl p-4 space-y-3">
                            <h3 className="text-lg font-semibold text-purple-200">Add Manual Item</h3>
                            <form action={addManualGroceryItem} className="grid grid-cols-1 md:grid-cols-6 gap-2">
                                <input type="hidden" name="groceryListId" value={selectedList.id} />
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Item name"
                                    required
                                    className="md:col-span-2 border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded bg-slate-900/80 text-slate-100"
                                />
                                <input
                                    type="number"
                                    step="0.1"
                                    name="quantity"
                                    placeholder="Qty"
                                    className="border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded bg-slate-900/80 text-slate-100"
                                />
                                <input
                                    type="text"
                                    name="unit"
                                    placeholder="Unit"
                                    className="border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded bg-slate-900/80 text-slate-100"
                                />
                                <select
                                    name="category"
                                    defaultValue="OTHER"
                                    className="border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded bg-slate-900/80 text-slate-100"
                                >
                                    {INGREDIENT_CATEGORIES.map((category) => (
                                        <option key={category} value={category}>
                                            {formatLabel(category)}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="submit"
                                    className="bg-slate-700 hover:bg-slate-600 text-slate-100 px-3 py-2 rounded text-sm font-medium transition-colors"
                                >
                                    Add Item
                                </button>
                                <input
                                    type="text"
                                    name="note"
                                    placeholder="Optional note"
                                    className="md:col-span-6 border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded bg-slate-900/80 text-slate-100"
                                />
                            </form>
                        </div>

                        <div className="space-y-4">
                            {groupedEntries.length === 0 ? (
                                <div className="text-center text-slate-400 py-8 bg-slate-800/40 border border-slate-700 rounded-xl">
                                    No grocery items yet.
                                </div>
                            ) : (
                                groupedEntries.map(([group, items]) => (
                                    <section key={group} className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 space-y-3">
                                        <h3 className="text-sm uppercase tracking-wide text-purple-300 font-semibold">
                                            {formatLabel(group)}
                                        </h3>
                                        <ul className="space-y-2">
                                            {items.map((item) => (
                                                <li key={item.id} className="bg-slate-900/60 border border-slate-700 rounded-lg p-3 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <form action={toggleGroceryItemChecked}>
                                                            <input type="hidden" name="groceryItemId" value={item.id} />
                                                            <input
                                                                type="hidden"
                                                                name="isChecked"
                                                                value={item.isChecked ? 'false' : 'true'}
                                                            />
                                                            <button
                                                                type="submit"
                                                                className={`h-7 w-7 rounded border text-sm ${
                                                                    item.isChecked
                                                                        ? 'bg-green-600/30 border-green-400 text-green-300'
                                                                        : 'bg-slate-800 border-slate-500 text-slate-300'
                                                                }`}
                                                                aria-label={item.isChecked ? 'Mark as not bought' : 'Mark as bought'}
                                                            >
                                                                {item.isChecked ? '✓' : ' '}
                                                            </button>
                                                        </form>
                                                        <div
                                                            className={`font-medium ${
                                                                item.isChecked ? 'line-through text-slate-500' : 'text-slate-100'
                                                            }`}
                                                        >
                                                            {item.quantity !== null ? `${String(item.quantity)} ` : ''}
                                                            {item.unit ? `${item.unit} ` : ''}
                                                            {item.nameSnapshot}
                                                        </div>
                                                    </div>

                                                    <form action={updateGroceryItem} className="grid grid-cols-1 md:grid-cols-6 gap-2">
                                                        <input type="hidden" name="groceryItemId" value={item.id} />
                                                        <input
                                                            type="text"
                                                            name="name"
                                                            defaultValue={item.nameSnapshot}
                                                            required
                                                            className="md:col-span-2 border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded bg-slate-900/80 text-slate-100 text-sm"
                                                        />
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            name="quantity"
                                                            defaultValue={item.quantity !== null ? String(item.quantity) : ''}
                                                            placeholder="Qty"
                                                            className="border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded bg-slate-900/80 text-slate-100 text-sm"
                                                        />
                                                        <input
                                                            type="text"
                                                            name="unit"
                                                            defaultValue={item.unit || ''}
                                                            placeholder="Unit"
                                                            className="border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded bg-slate-900/80 text-slate-100 text-sm"
                                                        />
                                                        <select
                                                            name="category"
                                                            defaultValue={item.category || 'OTHER'}
                                                            className="border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded bg-slate-900/80 text-slate-100 text-sm"
                                                        >
                                                            {INGREDIENT_CATEGORIES.map((category) => (
                                                                <option key={category} value={category}>
                                                                    {formatLabel(category)}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <div className="flex gap-2">
                                                            <button
                                                                type="submit"
                                                                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-100 px-3 py-2 rounded text-xs font-medium transition-colors"
                                                            >
                                                                Save
                                                            </button>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            name="note"
                                                            defaultValue={item.note || ''}
                                                            placeholder="Optional note"
                                                            className="md:col-span-6 border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded bg-slate-900/80 text-slate-100 text-sm"
                                                        />
                                                    </form>

                                                    <form action={deleteGroceryItem}>
                                                        <input type="hidden" name="groceryItemId" value={item.id} />
                                                        <button
                                                            type="submit"
                                                            className="text-rose-400 hover:text-rose-300 hover:bg-slate-700/50 rounded px-2 py-1 text-xs"
                                                            aria-label="Delete grocery item"
                                                        >
                                                            Delete
                                                        </button>
                                                    </form>
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
