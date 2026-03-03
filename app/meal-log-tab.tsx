import { prisma } from '@/lib/prisma'
import { MealLogList } from './meal-log-list'
import { MealLogForm } from './components/meal-log-form'

export async function MealLogTab() {
    const mealLogs = await prisma.mealLog.findMany({
        orderBy: { cookedAt: 'desc' },
    })

    return (
        <div className="flex gap-6 h-full">
            <div className="w-[480px] flex-shrink-0 overflow-y-auto">
                <div className="space-y-4 p-4">
                    <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-purple-500/30">
                        <h2 className="text-lg font-semibold text-purple-200 mb-3">Log Cooked Meal</h2>
                        <MealLogForm />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="p-4">
                    <MealLogList mealLogs={mealLogs} />
                </div>
            </div>
        </div>
    )
}
