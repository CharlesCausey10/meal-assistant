'use client'

import { useState } from 'react'
import { addManualGroceryItem } from '../actions-grocery'
import { GroceryItem } from './grocery-item'
import { ResponsiveModal } from './responsive-modal'
import { formatLabel } from '../utils/format'
import type { IngredientCategory } from '@prisma/client'

type GroceryListContentProps = {
    selectedList: {
        id: number
        name: string
        notes: string | null
        sourceMeals: Array<{
            id: number
            meal: {
                name: string
            }
        }>
        items: Array<{
            id: number
            nameSnapshot: string
            quantity: number | null
            unit: string | null
            category: IngredientCategory | null
            note: string | null
            isChecked: boolean
            sortOrder: number
            createdAt: Date
        }>
    }
    ingredientCategories: IngredientCategory[]
    groupOrder: string[]
    onCreateListClick: () => void
}

export function GroceryListContent({
    selectedList,
    ingredientCategories,
    groupOrder,
    onCreateListClick,
}: GroceryListContentProps) {
    const [hideChecked, setHideChecked] = useState(false)
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const visibleItems = selectedList.items.filter((item) =>
        hideChecked ? !item.isChecked : true
    )

    const groupedItems = visibleItems.reduce<
        Record<string, typeof visibleItems>
    >((groups, item) => {
        const key = item.category || 'UNCATEGORIZED'

        if (!groups[key]) {
            groups[key] = []
        }

        groups[key].push(item)
        return groups
    }, {})

    const groupedEntries = Object.entries(groupedItems).sort((a, b) => {
        const indexA = groupOrder.indexOf(a[0])
        const indexB = groupOrder.indexOf(b[0])

        const safeIndexA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA
        const safeIndexB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB

        return safeIndexA - safeIndexB
    })

    return (
        <>
            {/* Floating + button - mobile only */}
            <button
                onClick={() => setIsAddItemModalOpen(true)}
                className="md:hidden fixed bottom-6 right-6 z-40 bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl font-light transition-all"
                aria-label="Add grocery item"
            >
                +
            </button>

            {/* Add Manual Item Modal - mobile only */}
            <ResponsiveModal
                title="Add Manual Item"
                isOpen={isAddItemModalOpen}
                onClose={() => setIsAddItemModalOpen(false)}
                position='top'
            >
                <form
                    action={async (formData) => {
                        await addManualGroceryItem(formData)
                        setIsAddItemModalOpen(false)
                    }}
                    className="space-y-3"
                >
                    <input type="hidden" name="groceryListId" value={selectedList.id} />
                    <input
                        type="text"
                        name="name"
                        placeholder="Item name"
                        required
                        autoFocus
                        className="w-full border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded bg-slate-900/80 text-slate-100"
                    />
                    {/* <div className="grid grid-cols-2 gap-2">
                        <input
                            type="number"
                            step="0.1"
                            name="quantity"
                            placeholder="Quantity"
                            className="border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded bg-slate-900/80 text-slate-100"
                        />
                        <input
                            type="text"
                            name="unit"
                            placeholder="Unit"
                            className="border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded bg-slate-900/80 text-slate-100"
                        />
                    </div> */}
                    <select
                        name="category"
                        defaultValue="OTHER"
                        className="w-full border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded bg-slate-900/80 text-slate-100"
                    >
                        {ingredientCategories.map((category) => (
                            <option key={category} value={category}>
                                {formatLabel(category)}
                            </option>
                        ))}
                    </select>
                    <button
                        type="submit"
                        className="w-full bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
                    >
                        Add Item
                    </button>
                </form>
            </ResponsiveModal>

            <div className="space-y-3">
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-xl font-semibold text-slate-100">
                            {selectedList.name}
                        </h2>
                        <div className="flex items-center gap-2">
                            {/* Desktop hide/show toggle */}
                            <button
                                onClick={() => setHideChecked(!hideChecked)}
                                className="hidden md:block text-sm text-purple-300 hover:text-purple-200 transition-colors"
                            >
                                {hideChecked ? 'Show checked items' : 'Hide checked items'}
                            </button>
                            {/* Mobile 3-dot menu */}
                            <div className="md:hidden relative">
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="text-slate-300 hover:text-slate-100 p-2 rounded hover:bg-slate-700/50 transition-colors"
                                    aria-label="Menu"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                    </svg>
                                </button>
                                {isMenuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-30"
                                            onClick={() => setIsMenuOpen(false)}
                                        />
                                        <div className="absolute right-0 top-full mt-2 w-56 bg-slate-800 border border-purple-500/30 rounded-lg shadow-xl z-40 overflow-hidden">
                                            <button
                                                onClick={() => {
                                                    setHideChecked(!hideChecked)
                                                    setIsMenuOpen(false)
                                                }}
                                                className="w-full text-left px-4 py-3 text-slate-200 hover:bg-slate-700/50 transition-colors border-b border-slate-700"
                                            >
                                                {hideChecked ? 'Show checked items' : 'Hide checked items'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    onCreateListClick()
                                                    setIsMenuOpen(false)
                                                }}
                                                className="w-full text-left px-4 py-3 text-slate-200 hover:bg-slate-700/50 transition-colors"
                                            >
                                                Create New List
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    {selectedList.notes && (
                        <p className="text-sm text-slate-300">{selectedList.notes}</p>
                    )}
                    {/* {selectedList.sourceMeals.length > 0 && (
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
                )} */}
                </div>

                {/* Desktop Add Manual Item form - hidden on mobile */}
                <div className="hidden md:block bg-slate-800/60 border border-purple-500/30 rounded-xl p-3 space-y-2">
                    <h3 className="text-lg font-semibold text-purple-200">Add Manual Item</h3>
                    <form
                        action={addManualGroceryItem}
                        className="grid grid-cols-1 md:grid-cols-6 gap-2"
                    >
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
                            {ingredientCategories.map((category) => (
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

                <div className="space-y-3.5">
                    {groupedEntries.length === 0 ? (
                        <div className="text-center text-slate-400 py-8 bg-slate-800/40 border border-slate-700 rounded-xl">
                            No grocery items yet.
                        </div>
                    ) : (
                        groupedEntries.map(([group, items]) => (
                            <section
                                key={group}
                                className="space-y-1.5"
                            >
                                <h3 className="text-sm uppercase tracking-wide text-purple-300 font-semibold">
                                    {formatLabel(group)}
                                </h3>
                                <ul className="space-y-1.5">
                                    {items.map((item) => (
                                        <GroceryItem
                                            key={item.id}
                                            item={item}
                                            ingredientCategories={ingredientCategories}
                                        />
                                    ))}
                                </ul>
                            </section>
                        ))
                    )}
                </div>
            </div>
        </>
    )
}
