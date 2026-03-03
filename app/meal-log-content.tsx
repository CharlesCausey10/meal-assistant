'use client'

import { useState } from 'react'
import type { MealLog } from '@prisma/client'
import { MealLogList } from './meal-log-list'
import { MealLogForm } from './components/meal-log-form'
import { ResponsiveModal } from './components/responsive-modal'

export function MealLogContent({ mealLogs }: { mealLogs: MealLog[] }) {
    const [isNewLogOpen, setIsNewLogOpen] = useState(false)

    return (
        <div className="h-full flex flex-col md:flex-row md:gap-6">
            <div className="md:hidden p-3 border-b border-purple-500/20">
                <button
                    type="button"
                    onClick={() => setIsNewLogOpen(true)}
                    className="w-full bg-linear-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium"
                >
                    New Log
                </button>
            </div>

            <div className="hidden md:block w-120 shrink-0 overflow-y-auto">
                <div className="space-y-4 p-4">
                    <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-purple-500/30">
                        <h2 className="text-lg font-semibold text-purple-200 mb-3">Cook Meal</h2>
                        <MealLogForm />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="p-4">
                    <MealLogList mealLogs={mealLogs} />
                </div>
            </div>

            <ResponsiveModal title="Cook Meal" isOpen={isNewLogOpen} onClose={() => setIsNewLogOpen(false)}>
                <MealLogForm onSuccess={() => setIsNewLogOpen(false)} />
            </ResponsiveModal>
        </div>
    )
}
