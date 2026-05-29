'use client'

import Link from 'next/link'
import { ResponsiveModal } from './responsive-modal'
import { MealSelector } from './meal-selector'
import { createGroceryList, deleteGroceryList } from '../actions-grocery'

type GroceryListSidebarProps = {
    mealOptions: Array<{ id: number; name: string; categoryLabel: string }>
    groceryLists: Array<{
        id: number
        name: string
    }>
    selectedListId: number | null
    isCreateModalOpen: boolean
    onCreateModalOpenChange: (open: boolean) => void
}

export function GroceryListSidebar({
    mealOptions,
    groceryLists,
    selectedListId,
    isCreateModalOpen,
    onCreateModalOpenChange,
}: GroceryListSidebarProps) {

    return (
        <>
            {/* Mobile modal */}
            <ResponsiveModal
                title="Create Grocery List"
                isOpen={isCreateModalOpen}
                onClose={() => onCreateModalOpenChange(false)}
            >
                <form
                    action={async (formData) => {
                        await createGroceryList(formData)
                        onCreateModalOpenChange(false)
                    }}
                    className="space-y-3"
                >
                    <input
                        type="text"
                        name="name"
                        placeholder="Weekly Grocery List"
                        className="w-full border border-app-border focus:border-primary focus:outline-none p-3 rounded-lg bg-app-surface-raised/90 text-app-text"
                    />

                    <MealSelector meals={mealOptions} />

                    <button
                        type="submit"
                        className="w-full bg-linear-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary-hover text-primary-contrast px-4 py-2 rounded-lg font-medium transition-all"
                    >
                        Create Grocery List
                    </button>
                </form>
            </ResponsiveModal>

            {/* Desktop sidebar - hidden on mobile */}
            <div className="hidden md:block md:w-120 shrink-0 overflow-y-auto">
                <div className="space-y-4 p-4">
                    <div className="bg-app-surface p-6 rounded-xl shadow-lg border border-primary/30 space-y-3">
                        <h2 className="text-lg font-semibold text-primary-text">
                            Create Grocery List
                        </h2>
                        <form action={createGroceryList} className="space-y-3">
                            <input
                                type="text"
                                name="name"
                                placeholder="Weekly Grocery List"
                                className="w-full border border-app-border focus:border-primary focus:outline-none p-3 rounded-lg bg-app-surface-raised/90 text-app-text"
                            />

                            <MealSelector meals={mealOptions} />

                            <button
                                type="submit"
                                className="w-full bg-linear-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary-hover text-primary-contrast px-4 py-2 rounded-lg font-medium transition-all"
                            >
                                Create Grocery List
                            </button>
                        </form>
                    </div>

                    <div className="bg-app-surface p-6 rounded-xl shadow-lg border border-primary/30 space-y-3">
                        <h2 className="text-lg font-semibold text-primary-text">Saved Lists</h2>
                        {groceryLists.length === 0 ? (
                            <p className="text-sm text-app-subtle">No grocery lists yet.</p>
                        ) : (
                            <ul className="space-y-2">
                                {groceryLists.map((list) => {
                                    const isActive = selectedListId === list.id
                                    const listUrl = `/?tab=grocery&listId=${list.id}`

                                    return (
                                        <li key={list.id} className="flex items-center gap-2">
                                            <a
                                                href={listUrl}
                                                className={`flex-1 rounded-lg px-3 py-2 text-sm border transition-colors ${
                                                    isActive
                                                        ? 'border-primary text-primary-text bg-primary-soft/70'
                                                        : 'border-app-border text-app-muted hover:border-primary/50'
                                                }`}
                                            >
                                                {list.name}
                                            </a>
                                            <form action={deleteGroceryList}>
                                                <input
                                                    type="hidden"
                                                    name="groceryListId"
                                                    value={list.id}
                                                />
                                                <button
                                                    type="submit"
                                                    className="text-danger hover:text-danger-hover hover:bg-app-surface-soft/80 rounded-lg p-2 transition-colors"
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

                    <div className="bg-app-surface p-6 rounded-xl shadow-lg border border-primary/30 space-y-3">
                        <h2 className="text-lg font-semibold text-primary-text">Ingredients</h2>
                        <Link
                            href="/?tab=ingredients"
                            className="block text-center bg-linear-to-r from-accent to-accent-hover hover:from-accent-hover hover:to-accent-hover text-primary-contrast px-4 py-2 rounded-lg font-medium transition-all"
                        >
                            ✏️ Edit Ingredients
                        </Link>
                    </div>
                </div>
            </div>
        </>
    )
}
