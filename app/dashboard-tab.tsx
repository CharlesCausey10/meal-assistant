import { Category, type MealLog } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { measureAsync } from '@/lib/timing'
import { logMeal } from './actions-meal-log'
import { RateMealControl } from './components/rate-meal-control'
import { getDaysUntilExpiration, getExpirationStatus } from './utils/expiration'
import { formatLabel } from './utils/format'
import { serializeMeals, type SerializedMealWithIngredients } from './utils/convert-prisma'
import { getMealCategoriesForDisplay, hasMealCategory } from './utils/categories'
import { TodayAllMealsSection } from './today-all-meals-section'
import { formatTasteRating } from './utils/taste'

type MealStats = {
    lastCookedAt: Date | null
    cookedCount: number
}

type CookedMealStatsRow = {
    mealId: number | null
    _max: {
        cookedAt: Date | null
    }
    _count: {
        _all: number
    }
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
    rows: CookedMealStatsRow[]
): Map<number, MealStats> {
    const statsByMealId = new Map<number, MealStats>()

    for (const row of rows) {
        if (row.mealId === null) {
            continue
        }

        statsByMealId.set(row.mealId, {
            lastCookedAt: row._max.cookedAt,
            cookedCount: row._count._all,
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
    const seenMealIds = new Set<number>()
    const mealGroups = categories.map((category) => meals.filter((meal) => hasMealCategory(meal, category)))
    const interleavedMeals: SerializedMealWithIngredients[] = []
    const maxGroupLength = Math.max(...mealGroups.map((group) => group.length))

    for (let index = 0; index < maxGroupLength; index += 1) {
        for (const group of mealGroups) {
            const meal = group[index]
            if (meal && !seenMealIds.has(meal.id)) {
                seenMealIds.add(meal.id)
                interleavedMeals.push(meal)
            }
        }
    }

    return interleavedMeals
}

function formatDaysSince(daysSinceCooked: number | null): string {
    if (daysSinceCooked === null) {
        return ''
    }

    if (daysSinceCooked === 0) {
        return 'Cooked today'
    }

    return `Last cooked ${daysSinceCooked}d ago`
}

function tasteChip(meal: SerializedMealWithIngredients): string {
    return meal.preference === null ? 'Not rated' : formatTasteRating(meal.preference)
}

function ingredientsChip(meal: SerializedMealWithIngredients): string {
    const count = meal.ingredients.length
    return count === 1 ? '1 ingredient' : `${count} ingredients`
}

function getTodayInputValue() {
    return new Date().toISOString().slice(0, 10)
}

function getMealReason(meal: SerializedMealWithIngredients): string {
    const category = getMealCategoriesForDisplay(meal).map(formatLabel).join(' / ')

    if (meal.cookedCount === 0) {
        return category
    }

    return `${category} - cooked ${meal.cookedCount} time${meal.cookedCount === 1 ? '' : 's'}`
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
                                {tasteChip(meal)}
                            </span>
                            {meal.daysSinceCooked !== null ? (
                                <span className="rounded-full bg-app-surface-soft px-2 py-1 text-xs font-semibold text-app-muted">
                                    {formatDaysSince(meal.daysSinceCooked)}
                                </span>
                            ) : null}
                            {meal.ingredients.length > 0 ? (
                                <span className="rounded-full bg-app-surface-soft px-2 py-1 text-xs font-semibold text-app-muted">
                                    {ingredientsChip(meal)}
                                </span>
                            ) : null}
                            {meal.recipeUrl ? (
                                <span className="rounded-full bg-info/15 px-2 py-1 text-xs font-semibold text-info">
                                    Has recipe
                                </span>
                            ) : null}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            <form action={logMeal}>
                                <input type="hidden" name="mealId" value={meal.id} />
                                <input type="hidden" name="name" value={meal.name} />
                                <input type="hidden" name="protein" value={meal.protein ?? ''} />
                                <input type="hidden" name="cookedAt" value={getTodayInputValue()} />
                                <button
                                    type="submit"
                                    className="min-h-9 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-contrast hover:bg-primary-hover"
                                >
                                    Cook today
                                </button>
                            </form>
                            {meal.preference === null ? (
                                <RateMealControl mealId={meal.id} mealName={meal.name} />
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
    const [meals, cookedLogs, activeLeftovers, groceryLists] = await measureAsync(
        'tab.today.queries',
        () => Promise.all([
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
                    categories: {
                        select: { category: true },
                        orderBy: { id: 'asc' },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.mealLog.groupBy({
                by: ['mealId'],
                where: {
                    householdId,
                    mealId: { not: null },
                },
                _max: {
                    cookedAt: true,
                },
                _count: {
                    _all: true,
                },
            }),
            prisma.mealLog.findMany({
                where: { householdId, isActive: true },
                select: {
                    id: true,
                    name: true,
                    protein: true,
                    cookedAt: true,
                    mealId: true,
                    meal: {
                        select: {
                            name: true,
                        },
                    },
                },
                orderBy: { cookedAt: 'desc' },
            }),
            prisma.groceryList.findMany({
                where: { householdId },
                select: {
                    id: true,
                    name: true,
                },
                orderBy: { updatedAt: 'desc' },
            }),
        ]),
        { tab: 'today' }
    )

    const mealWindow = getMealWindow(new Date())
    const statsByMealId = buildStatsByMealId(cookedLogs)
    const dashboardMeals = serializeMeals(meals, statsByMealId)
        .filter((meal) => !hasMealCategory(meal, Category.DESSERT))
    const allMeals = serializeMeals(meals, statsByMealId)
    const rankedMealWindowIdeas = dashboardMeals
        .filter((meal) => mealWindow.categories.some((category) => hasMealCategory(meal, category)))
        .sort(rankMeals)
    const topMealIdeas = (mealWindow.shouldInterleaveCategories
        ? interleaveMealGroups(rankedMealWindowIdeas, mealWindow.categories)
        : rankedMealWindowIdeas
    )
        .slice(0, 8)
    const forgottenFavorites = dashboardMeals
        .filter((meal) => (meal.preference ?? 0) >= 7)
        .filter((meal) => meal.daysSinceCooked !== null && meal.daysSinceCooked >= 45)
        .sort(rankMeals)
        .slice(0, 8)
    const snackIdeas = dashboardMeals
        .filter((meal) => hasMealCategory(meal, Category.SNACK))
        .sort(rankMeals)
        .slice(0, 8)
    return (
        <div className="h-full overflow-y-auto p-3 pb-6 md:p-5">
            <div className="mx-auto flex max-w-5xl flex-col gap-5">
                <section>
                    <div className="mb-2 px-1">
                        <h2 className="text-lg font-semibold text-app-text">
                            Top {mealWindow.label} Ideas
                        </h2>
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

                {forgottenFavorites.length > 0 ? (
                    <section>
                        <div className="mb-2 px-1">
                            <h2 className="text-lg font-semibold text-app-text">Forgotten Favorites</h2>
                            <p className="text-sm text-app-muted">High taste score plus no recent cooked history.</p>
                        </div>
                        <MealRail meals={forgottenFavorites} emptyText="" />
                    </section>
                ) : null}

                <section>
                    <div className="mb-2 px-1">
                        <h2 className="text-lg font-semibold text-app-text">Snack Ideas</h2>
                        <p className="text-sm text-app-muted">Snack category sorted by the same meal stats.</p>
                    </div>
                    <MealRail meals={snackIdeas} emptyText="No snack meals yet." />
                </section>

                <TodayAllMealsSection meals={allMeals} groceryLists={groceryLists} />
            </div>
        </div>
    )
}
