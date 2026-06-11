import { Category, type MealLog } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getDaysUntilExpiration, getExpirationStatus } from './utils/expiration'
import { formatLabel } from './utils/format'
import { serializeMeals, type SerializedMealWithIngredients } from './utils/convert-prisma'

type MealStats = {
    lastCookedAt: Date | null
    cookedCount: number
}

type MealWindow = {
    label: string
    categories: Category[]
    shouldInterleaveCategories?: boolean
}

function getMealWindow(now: Date): MealWindow {
    const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes()
    const breakfastStart = 4 * 60
    const brunchStart = 10 * 60 + 30
    const lunchStart = 12 * 60
    const dinnerStart = 15 * 60
    const midnightSnackStart = 23 * 60

    if (minutesSinceMidnight >= breakfastStart && minutesSinceMidnight < brunchStart) {
        return { label: 'Breakfast', categories: [Category.BREAKFAST] }
    }

    if (minutesSinceMidnight >= brunchStart && minutesSinceMidnight < lunchStart) {
        return {
            label: 'Brunch',
            categories: [Category.BREAKFAST, Category.LUNCH],
            shouldInterleaveCategories: true,
        }
    }

    if (minutesSinceMidnight >= lunchStart && minutesSinceMidnight < dinnerStart) {
        return { label: 'Lunch', categories: [Category.LUNCH] }
    }

    if (minutesSinceMidnight >= dinnerStart && minutesSinceMidnight < midnightSnackStart) {
        return { label: 'Dinner', categories: [Category.DINNER] }
    }

    return { label: 'Midnight Snack', categories: [Category.SNACK] }
}

function buildStatsByMealId(
    logs: Array<Pick<MealLog, 'mealId' | 'cookedAt'>>
): Map<number, MealStats> {
    const statsByMealId = new Map<number, MealStats>()

    for (const log of logs) {
        if (log.mealId === null) {
            continue
        }

        const current = statsByMealId.get(log.mealId) ?? {
            lastCookedAt: null,
            cookedCount: 0,
        }

        statsByMealId.set(log.mealId, {
            lastCookedAt:
                current.lastCookedAt === null || log.cookedAt > current.lastCookedAt
                    ? log.cookedAt
                    : current.lastCookedAt,
            cookedCount: current.cookedCount + 1,
        })
    }

    return statsByMealId
}

function rankMeals(a: SerializedMealWithIngredients, b: SerializedMealWithIngredients): number {
    const preferenceDiff = (b.preference ?? -1) - (a.preference ?? -1)
    if (preferenceDiff !== 0) return preferenceDiff

    const daysA = a.daysSinceCooked ?? Number.MAX_SAFE_INTEGER
    const daysB = b.daysSinceCooked ?? Number.MAX_SAFE_INTEGER
    if (daysA !== daysB) return daysB - daysA

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
}

function interleaveMealGroups(
    meals: SerializedMealWithIngredients[],
    categories: Category[]
): SerializedMealWithIngredients[] {
    const mealGroups = categories.map((category) => meals.filter((meal) => meal.category === category))
    const interleavedMeals: SerializedMealWithIngredients[] = []
    const maxGroupLength = Math.max(...mealGroups.map((group) => group.length))

    for (let index = 0; index < maxGroupLength; index += 1) {
        for (const group of mealGroups) {
            const meal = group[index]
            if (meal) {
                interleavedMeals.push(meal)
            }
        }
    }

    return interleavedMeals
}

function formatDaysSince(daysSinceCooked: number | null): string {
    if (daysSinceCooked === null) {
        return 'No cooked log'
    }

    if (daysSinceCooked === 0) {
        return 'Cooked today'
    }

    return `Last cooked ${daysSinceCooked}d ago`
}

function preferenceChip(meal: SerializedMealWithIngredients): string {
    return meal.preference === null ? 'No score' : `${meal.preference}/10`
}

function recipeChip(meal: SerializedMealWithIngredients): string {
    return meal.recipeUrl ? 'Has recipe' : 'No recipe URL'
}

function ingredientsChip(meal: SerializedMealWithIngredients): string {
    const count = meal.ingredients.length
    return count === 1 ? '1 ingredient' : `${count} ingredients`
}

function getMealReason(meal: SerializedMealWithIngredients): string {
    const category = formatLabel(meal.category)
    const cookedText =
        meal.cookedCount > 0
            ? `cooked ${meal.cookedCount} time${meal.cookedCount === 1 ? '' : 's'}`
            : 'no cooked log'

    return `${category} - ${cookedText}`
}

function MealRail({
    meals,
    emptyText,
}: {
    meals: SerializedMealWithIngredients[]
    emptyText: string
}) {
    if (meals.length === 0) {
        return (
            <div className="rounded-lg border border-app-border bg-app-surface/80 p-4 text-sm text-app-subtle">
                {emptyText}
            </div>
        )
    }

    return (
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {meals.map((meal) => (
                <article
                    key={meal.id}
                    className="w-[78%] max-w-[20rem] shrink-0 rounded-xl border border-app-border bg-app-surface/90 p-4 shadow-sm"
                >
                    <div className="space-y-2">
                        <div>
                            <h3 className="text-base font-semibold leading-tight text-app-text">
                                {meal.name}
                            </h3>
                            <p className="mt-1 text-xs text-app-muted">{getMealReason(meal)}</p>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                            <span className="rounded-full bg-primary-soft px-2 py-1 text-xs font-semibold text-primary-text">
                                {preferenceChip(meal)}
                            </span>
                            {meal.daysSinceCooked !== null ? (
                                <span className="rounded-full bg-app-surface-soft px-2 py-1 text-xs font-semibold text-app-muted">
                                    {formatDaysSince(meal.daysSinceCooked)}
                                </span>
                            ) : null}
                            <span className="rounded-full bg-app-surface-soft px-2 py-1 text-xs font-semibold text-app-muted">
                                {ingredientsChip(meal)}
                            </span>
                            {meal.recipeUrl ? (
                                <span className="rounded-full bg-info/15 px-2 py-1 text-xs font-semibold text-info">
                                    Has recipe
                                </span>
                            ) : null}
                        </div>
                    </div>
                </article>
            ))}
        </div>
    )
}

function UseSoonRail({
    logs,
}: {
    logs: Array<
        Pick<MealLog, 'id' | 'name' | 'protein' | 'cookedAt' | 'mealId'> & {
            meal: { name: string } | null
        }
    >
}) {
    const sortedLogs = [...logs].sort((a, b) => {
        return getDaysUntilExpiration(a.cookedAt, a.protein) - getDaysUntilExpiration(b.cookedAt, b.protein)
    })

    if (sortedLogs.length === 0) {
        return (
            <div className="rounded-lg border border-app-border bg-app-surface/80 p-4 text-sm text-app-subtle">
                No active leftovers right now.
            </div>
        )
    }

    return (
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {sortedLogs.slice(0, 8).map((log) => {
                const daysLeft = getDaysUntilExpiration(log.cookedAt, log.protein)
                const status = getExpirationStatus(daysLeft)
                const statusClass =
                    status === 'expired'
                        ? 'bg-danger-soft text-danger'
                        : status === 'expiring-soon'
                            ? 'bg-warning-soft text-warning'
                            : 'bg-success-soft text-success'

                return (
                    <article
                        key={log.id}
                        className="w-[76%] max-w-[19rem] shrink-0 rounded-xl border border-app-border bg-app-surface/90 p-4 shadow-sm"
                    >
                        <h3 className="text-base font-semibold leading-tight text-app-text">
                            {log.meal?.name ?? log.name}
                        </h3>
                        <p className="mt-1 text-xs text-app-muted">
                            Cooked {log.cookedAt.toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                            })}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass}`}>
                                {daysLeft > 1
                                    ? `${daysLeft} days left`
                                    : daysLeft === 1
                                        ? '1 day left'
                                        : 'Expired'}
                            </span>
                            <span className="rounded-full bg-app-surface-soft px-2 py-1 text-xs font-semibold text-app-muted">
                                Logged leftover
                            </span>
                        </div>
                    </article>
                )
            })}
        </div>
    )
}

export async function DashboardTab({
    householdId,
    userId,
}: {
    householdId: number
    userId: number
}) {
    const [meals, cookedLogs, activeLeftovers] = await Promise.all([
        prisma.meal.findMany({
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
        }),
        prisma.mealLog.findMany({
            where: {
                householdId,
                mealId: { not: null },
            },
            select: {
                mealId: true,
                cookedAt: true,
            },
            orderBy: { cookedAt: 'desc' },
        }),
        prisma.mealLog.findMany({
            where: { householdId, isActive: true },
            include: {
                meal: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: { cookedAt: 'desc' },
        }),
    ])

    const mealWindow = getMealWindow(new Date())
    const statsByMealId = buildStatsByMealId(cookedLogs)
    const dashboardMeals = serializeMeals(meals, statsByMealId)
        .filter((meal) => meal.category !== Category.DESSERT)
    const rankedMealWindowIdeas = dashboardMeals
        .filter((meal) => mealWindow.categories.includes(meal.category))
        .sort(rankMeals)
    const topMealIdeas = (mealWindow.shouldInterleaveCategories
        ? interleaveMealGroups(rankedMealWindowIdeas, mealWindow.categories)
        : rankedMealWindowIdeas
    )
        .slice(0, 8)
    const forgottenFavorites = dashboardMeals
        .filter((meal) => (meal.preference ?? 0) >= 7)
        .filter((meal) => meal.daysSinceCooked === null || meal.daysSinceCooked >= 45)
        .sort(rankMeals)
        .slice(0, 8)
    const snackIdeas = dashboardMeals
        .filter((meal) => meal.category === Category.SNACK)
        .sort(rankMeals)
        .slice(0, 8)
    const primaryMeal = topMealIdeas[0] ?? dashboardMeals.sort(rankMeals)[0] ?? null

    return (
        <div className="h-full overflow-y-auto p-3 pb-6 md:p-5">
            <div className="mx-auto flex max-w-5xl flex-col gap-5">
                <section className="rounded-xl border border-primary/25 bg-app-surface/90 p-4 shadow-sm md:p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold text-app-muted">Today</p>
                            <h2 className="mt-1 text-2xl font-semibold leading-tight text-app-text">
                                What sounds good?
                            </h2>
                        </div>
                        <span className="rounded-full bg-primary-soft px-3 py-1 text-sm font-semibold text-primary-text">
                            {mealWindow.label}
                        </span>
                    </div>

                    {primaryMeal ? (
                        <div className="mt-4 rounded-xl bg-primary text-primary-contrast p-4">
                            <p className="text-sm font-semibold opacity-90">
                                Top {mealWindow.label.toLowerCase()} idea
                            </p>
                            <h3 className="mt-2 text-2xl font-semibold leading-tight">{primaryMeal.name}</h3>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className="rounded-full bg-app-surface/20 px-2.5 py-1 text-xs font-semibold">
                                    {preferenceChip(primaryMeal)}
                                </span>
                                {primaryMeal.daysSinceCooked !== null ? (
                                    <span className="rounded-full bg-app-surface/20 px-2.5 py-1 text-xs font-semibold">
                                        {formatDaysSince(primaryMeal.daysSinceCooked)}
                                    </span>
                                ) : null}
                                <span className="rounded-full bg-app-surface/20 px-2.5 py-1 text-xs font-semibold">
                                    {recipeChip(primaryMeal)}
                                </span>
                                <span className="rounded-full bg-app-surface/20 px-2.5 py-1 text-xs font-semibold">
                                    {ingredientsChip(primaryMeal)}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <p className="mt-4 rounded-lg bg-app-surface-soft p-4 text-sm text-app-muted">
                            Add meals to start seeing dashboard ideas.
                        </p>
                    )}
                </section>

                <section>
                    <div className="mb-2 px-1">
                        <h2 className="text-lg font-semibold text-app-text">
                            Top {mealWindow.label} Ideas
                        </h2>
                        <p className="text-sm text-app-muted">
                            Preference score, meal type, cooked history, recipe URL, and ingredient count.
                        </p>
                    </div>
                    <MealRail meals={topMealIdeas} emptyText={`No ${mealWindow.label.toLowerCase()} meals yet.`} />
                </section>

                <section>
                    <div className="mb-2 flex items-end justify-between gap-3 px-1">
                        <div>
                            <h2 className="text-lg font-semibold text-app-text">Use Soon</h2>
                            <p className="text-sm text-app-muted">Active leftovers sorted by expiration.</p>
                        </div>
                    </div>
                    <UseSoonRail logs={activeLeftovers} />
                </section>

                <section>
                    <div className="mb-2 px-1">
                        <h2 className="text-lg font-semibold text-app-text">Forgotten Favorites</h2>
                        <p className="text-sm text-app-muted">High preference plus no recent cooked log.</p>
                    </div>
                    <MealRail
                        meals={forgottenFavorites}
                        emptyText="No forgotten favorites yet. Cooked history will populate this."
                    />
                </section>

                <section>
                    <div className="mb-2 px-1">
                        <h2 className="text-lg font-semibold text-app-text">Snack Ideas</h2>
                        <p className="text-sm text-app-muted">Snack category sorted by the same meal stats.</p>
                    </div>
                    <MealRail meals={snackIdeas} emptyText="No snack meals yet." />
                </section>
            </div>
        </div>
    )
}
