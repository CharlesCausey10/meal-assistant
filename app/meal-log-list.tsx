'use client'

import { deleteMealLog } from './actions-meal-log'
import { getDaysUntilExpiration, getExpirationStatus } from './utils/expiration'
import type { MealLog } from '@prisma/client'

function getProteinEmoji(protein: string | null) {
    const emojiMap: Record<string, string> = {
        'CHICKEN_BREAST': '🐔',
        'CHICKEN_THIGHS': '🐔',
        'ROTISSERIE_CHICKEN': '🐔',
        'GROUND_BEEF': '🐄',
        'PORK_BUTT': '🐷',
        'FISH': '🐟',
        'EGGS': '🥚'
    }
    return protein ? emojiMap[protein] || '🍴' : '🍴'
}

function getDaysSinceCooking(cookedAt: Date): number {
    const now = new Date()
    const daysPassed = Math.floor((now.getTime() - cookedAt.getTime()) / (1000 * 60 * 60 * 24))
    return daysPassed
}

function getStatusColor(status: string) {
    switch (status) {
        case 'fresh':
            return 'text-green-400'
        case 'expiring-soon':
            return 'text-yellow-400'
        case 'expired':
            return 'text-red-400'
        default:
            return 'text-slate-400'
    }
}

function getStatusIcon(status: string) {
    switch (status) {
        case 'fresh':
            return '🟢'
        case 'expiring-soon':
            return '🟡'
        case 'expired':
            return '🔴'
        default:
            return '⚪'
    }
}

export function MealLogList({ mealLogs }: { mealLogs: MealLog[] }) {
    // Sort by days until expiration (closest to expiring first)
    const sortedMealLogs = [...mealLogs].sort((a, b) => {
        const daysLeftA = getDaysUntilExpiration(a.cookedAt, a.protein)
        const daysLeftB = getDaysUntilExpiration(b.cookedAt, b.protein)
        return daysLeftA - daysLeftB
    })

    return (
        <div className="space-y-3">
            {sortedMealLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                    No cooked meals logged yet
                </div>
            ) : (
                <ul className="space-y-3">
                    {sortedMealLogs.map(meal => {
                        const daysLeft = getDaysUntilExpiration(meal.cookedAt, meal.protein)
                        const daysSince = getDaysSinceCooking(meal.cookedAt)
                        const status = getExpirationStatus(daysLeft)
                        const statusColor = getStatusColor(status)
                        const statusIcon = getStatusIcon(status)

                        return (
                            <li
                                key={meal.id}
                                className={`bg-slate-800/50 backdrop-blur-sm border p-4 rounded-xl flex justify-between items-center hover:shadow-lg transition-all ${status === 'expired'
                                    ? 'border-red-500/30 hover:shadow-red-500/10'
                                    : status === 'expiring-soon'
                                        ? 'border-yellow-500/30 hover:shadow-yellow-500/10'
                                        : 'border-purple-500/20 hover:shadow-purple-500/10'
                                    }`}
                            >
                                <div>
                                    <div className="font-semibold text-slate-100 text-lg flex items-center gap-2">
                                        <span>{getProteinEmoji(meal.protein)}</span>
                                        <span>{meal.name}</span>
                                    </div>
                                    <div className="text-sm text-slate-300">
                                        <span className="text-slate-400">{daysSince === 0 ? 'Today' : `${daysSince} day${daysSince !== 1 ? 's' : ''} ago`}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className={`text-right ${statusColor}`}>
                                        <div className="text-sm font-medium">
                                            {statusIcon} {daysLeft > 1 ? daysLeft + ' days left' : daysLeft === 1 ? '1 day left' : 'Expired'}
                                        </div>
                                    </div>
                                    <form action={deleteMealLog}>
                                        <input type="hidden" name="id" value={meal.id} />
                                        <button
                                            type="submit"
                                            className="text-rose-400 hover:text-rose-300 hover:bg-slate-700/50 rounded-lg p-2 transition-colors"
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
