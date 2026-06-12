'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { copyDiscoveredMeal } from './actions-discover'
import { Toast } from './components/toast'
import { formatLabel } from './utils/format'

export type DiscoverMeal = {
    id: number
    name: string
    protein: string | null
    category: string
    categories: string[]
    recipeUrl: string | null
    ingredients: Array<{
        id: number
        quantity: number
        unit: string
        ingredient: {
            id: number
            name: string
        }
    }>
}

type SeenMeals = Record<string, number>

const SEEN_TTL_MS = 30 * 24 * 60 * 60 * 1000

function getStorageKey(userId: number) {
    return `meal-assistant.discover.seen.v1.${userId}`
}

function getSeenExpiration() {
    return Date.now() + SEEN_TTL_MS
}

function readSeenMeals(userId: number): SeenMeals {
    if (typeof window === 'undefined') {
        return {}
    }

    try {
        const rawValue = window.localStorage.getItem(getStorageKey(userId))
        const parsed = rawValue ? JSON.parse(rawValue) : {}
        const now = Date.now()
        const freshEntries = Object.entries(parsed).filter((entry): entry is [string, number] => {
            return typeof entry[1] === 'number' && entry[1] > now
        })

        return Object.fromEntries(freshEntries)
    } catch {
        return {}
    }
}

function writeSeenMeals(userId: number, seenMeals: SeenMeals) {
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(seenMeals))
}

export function DiscoverContent({
    meals,
    userId,
    sharedMealCount,
    duplicateMealCount,
}: {
    meals: DiscoverMeal[]
    userId: number
    sharedMealCount: number
    duplicateMealCount: number
}) {
    const [seenMeals, setSeenMeals] = useState<SeenMeals>(() => readSeenMeals(userId))
    const [pendingMealId, setPendingMealId] = useState<number | null>(null)
    const [toastMessage, setToastMessage] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        if (!toastMessage) {
            return
        }

        const timeout = setTimeout(() => setToastMessage(null), 2800)
        return () => clearTimeout(timeout)
    }, [toastMessage])

    const availableMeals = useMemo(() => {
        return meals.filter((meal) => !seenMeals[String(meal.id)])
    }, [meals, seenMeals])
    const hiddenMealCount = meals.length - availableMeals.length

    function markSeen(mealId: number) {
        const nextSeenMeals = {
            ...seenMeals,
            [String(mealId)]: getSeenExpiration(),
        }
        setSeenMeals(nextSeenMeals)
        writeSeenMeals(userId, nextSeenMeals)
    }

    function clearSeenMeals() {
        setSeenMeals({})
        window.localStorage.removeItem(getStorageKey(userId))
    }

    function handleCopy(mealId: number) {
        setPendingMealId(mealId)
        startTransition(async () => {
            const result = await copyDiscoveredMeal(mealId)
            if (result.ok) {
                markSeen(mealId)
            }
            setToastMessage(result.message)
            setPendingMealId(null)
        })
    }

    return (
        <div className="h-full overflow-y-auto p-3 md:p-4">
            <div className="mx-auto max-w-5xl space-y-4">
                <header className="flex flex-col gap-3 border-b border-primary/20 pb-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold text-app-text">Discover</h2>
                        <p className="mt-1 text-sm text-app-muted">
                            Meal templates shared by households that opted in.
                        </p>
                    </div>
                    {Object.keys(seenMeals).length > 0 ? (
                        <button
                            type="button"
                            onClick={clearSeenMeals}
                            className="self-start rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm font-semibold text-primary hover:text-primary-text md:self-auto"
                        >
                            Show hidden meals
                        </button>
                    ) : null}
                </header>

                {availableMeals.length === 0 ? (
                    <section className="rounded-lg border border-app-border bg-app-surface p-4">
                        {sharedMealCount === 0 ? (
                            <>
                                <h3 className="text-base font-semibold text-app-text">
                                    Build your meal set first
                                </h3>
                                <p className="mt-1 text-sm text-app-muted">
                                    Discover will get more useful as other households share meal templates. For now, add a meal you already make so it can show up in Today and grocery planning.
                                </p>
                                <Link
                                    href="/?tab=meals"
                                    className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-contrast hover:bg-primary-hover"
                                >
                                    Add a meal
                                </Link>
                            </>
                        ) : meals.length === 0 && duplicateMealCount === sharedMealCount ? (
                            <>
                                <h3 className="text-base font-semibold text-app-text">
                                    Your meal set is caught up
                                </h3>
                                <p className="mt-1 text-sm text-app-muted">
                                    {sharedMealCount} shared meals are available, and this household already has meals with the same names. Add more of your own staples while new ideas arrive.
                                </p>
                                <Link
                                    href="/?tab=meals"
                                    className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-contrast hover:bg-primary-hover"
                                >
                                    Add a meal
                                </Link>
                            </>
                        ) : hiddenMealCount > 0 ? (
                            <>
                                <h3 className="text-base font-semibold text-app-text">
                                    All suggestions are hidden
                                </h3>
                                <p className="mt-1 text-sm text-app-muted">
                                    {hiddenMealCount} suggestions are hidden on this browser. Use Show hidden meals to bring them back.
                                </p>
                            </>
                        ) : (
                            <>
                                <h3 className="text-base font-semibold text-app-text">
                                    Start with your own ideas
                                </h3>
                                <p className="mt-1 text-sm text-app-muted">
                                    More shared meals will appear as households opt in or hidden meals expire. In the meantime, add a meal you want Today to remember.
                                </p>
                                <Link
                                    href="/?tab=meals"
                                    className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-contrast hover:bg-primary-hover"
                                >
                                    Add a meal
                                </Link>
                            </>
                        )}
                    </section>
                ) : (
                    <ul className="grid gap-3 md:grid-cols-2">
                        {availableMeals.map((meal) => (
                            <li
                                key={meal.id}
                                className="flex flex-col gap-3 rounded-lg border border-primary/20 bg-app-surface/90 p-4 shadow-sm shadow-app-text/5"
                            >
                                <div>
                                    <h3 className="text-lg font-semibold text-app-text">{meal.name}</h3>
                                    <p className="mt-1 text-sm text-primary-text">
                                        {meal.protein ? `${formatLabel(meal.protein)} / ` : ''}
                                        {(meal.categories.length > 0 ? meal.categories : [meal.category])
                                            .map(formatLabel)
                                            .join(' / ')}
                                    </p>
                                </div>

                                {meal.ingredients.length > 0 ? (
                                    <div className="rounded-lg border border-app-border bg-app-surface-soft/60 p-3">
                                        <p className="text-xs font-semibold uppercase text-app-subtle">
                                            Ingredients
                                        </p>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {meal.ingredients.slice(0, 8).map((mealIngredient) => (
                                                <span
                                                    key={mealIngredient.id}
                                                    className="rounded-full bg-app-surface px-2 py-1 text-xs text-app-muted"
                                                >
                                                    {mealIngredient.ingredient.name}
                                                </span>
                                            ))}
                                            {meal.ingredients.length > 8 ? (
                                                <span className="rounded-full bg-app-surface px-2 py-1 text-xs text-app-subtle">
                                                    +{meal.ingredients.length - 8}
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                ) : null}

                                <div className="mt-auto flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(meal.id)}
                                        disabled={isPending && pendingMealId === meal.id}
                                        className="min-h-10 flex-1 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-contrast hover:bg-primary-hover disabled:cursor-wait disabled:opacity-70"
                                    >
                                        {isPending && pendingMealId === meal.id ? 'Copying...' : 'Copy'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => markSeen(meal.id)}
                                        className="min-h-10 rounded-lg border border-app-border bg-app-surface px-3 text-sm font-semibold text-app-muted hover:text-app-text"
                                    >
                                        Hide
                                    </button>
                                    {meal.recipeUrl ? (
                                        <a
                                            href={meal.recipeUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="min-h-10 rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm font-semibold text-info hover:text-info-hover"
                                        >
                                            Recipe
                                        </a>
                                    ) : null}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {toastMessage ? (
                <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
            ) : null}
        </div>
    )
}
