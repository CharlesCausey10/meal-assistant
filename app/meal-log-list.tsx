'use client'

import { deleteMealLog } from './actions-meal-log'
import { getDaysUntilExpiration, getExpirationStatus } from './utils/expiration'
import { formatProtein } from './utils/protein'
import type { MealLog } from '@prisma/client'

function getDaysSinceCooking(cookedAt: Date): number {
    const now = new Date()
    return Math.floor((now.getTime() - cookedAt.getTime()) / (1000 * 60 * 60 * 24))
}

function getStatusColor(status: string) {
    switch (status) {
        case 'fresh':
            return 'text-success'
        case 'expiring-soon':
            return 'text-warning'
        case 'expired':
            return 'text-danger'
        default:
            return 'text-app-subtle'
    }
}

function getStatusDotClass(status: string) {
    switch (status) {
        case 'fresh':
            return 'bg-success'
        case 'expiring-soon':
            return 'bg-warning'
        case 'expired':
            return 'bg-danger'
        default:
            return 'bg-app-subtle'
    }
}

export function MealLogList({ mealLogs }: { mealLogs: MealLog[] }) {
    const sortedMealLogs = [...mealLogs].sort((a, b) => {
        const daysLeftA = getDaysUntilExpiration(a.cookedAt, a.protein)
        const daysLeftB = getDaysUntilExpiration(b.cookedAt, b.protein)
        return daysLeftA - daysLeftB
    })

    return (
        <div className="space-y-3">
            {sortedMealLogs.length === 0 ? (
                <div className="text-center py-8 text-app-subtle">
                    No active leftovers yet
                </div>
            ) : (
                <ul className="space-y-3">
                    {sortedMealLogs.map((meal) => {
                        const daysLeft = getDaysUntilExpiration(meal.cookedAt, meal.protein)
                        const daysSince = getDaysSinceCooking(meal.cookedAt)
                        const status = getExpirationStatus(daysLeft)
                        const statusColor = getStatusColor(status)
                        const statusDotClass = getStatusDotClass(status)

                        return (
                            <li
                                key={meal.id}
                                className={`bg-app-surface/80 backdrop-blur-sm border p-4 rounded-xl flex justify-between items-center hover:shadow-lg transition-all ${status === 'expired'
                                    ? 'border-danger/40 hover:shadow-danger/10'
                                    : status === 'expiring-soon'
                                        ? 'border-warning/40 hover:shadow-warning/10'
                                        : 'border-primary/20 hover:shadow-primary/10'
                                    }`}
                            >
                                <div>
                                    <div className="font-semibold text-app-text text-lg">
                                        {meal.name}
                                    </div>
                                    <div className="text-sm text-app-muted">
                                        {meal.protein ? (
                                            <span>{formatProtein(meal.protein)} / </span>
                                        ) : null}
                                        <span className="text-app-subtle">
                                            {daysSince === 0 ? 'Today' : `${daysSince} day${daysSince !== 1 ? 's' : ''} ago`}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className={`text-right ${statusColor}`}>
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <span className={`h-2.5 w-2.5 rounded-full ${statusDotClass}`} />
                                            <span>
                                                {daysLeft > 1 ? `${daysLeft} days left` : daysLeft === 1 ? '1 day left' : 'Expired'}
                                            </span>
                                        </div>
                                    </div>
                                    <form action={deleteMealLog}>
                                        <input type="hidden" name="id" value={meal.id} />
                                        <button
                                            type="submit"
                                            className="text-danger hover:text-danger-hover hover:bg-app-surface-soft/80 rounded-lg p-2 transition-colors"
                                            aria-label="Delete meal log"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M3 6h18" />
                                                <path d="M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2" />
                                                <path d="M6 6l1 14a1 1 0 001 1h8a1 1 0 001-1l1-14" />
                                                <path d="M10 11v6" />
                                                <path d="M14 11v6" />
                                            </svg>
                                        </button>
                                    </form>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    )
}
