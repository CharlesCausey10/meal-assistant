import { prisma } from '@/lib/prisma'
import { MealLogContent } from './meal-log-content'

export async function MealLogTab() {
    const mealLogs = await prisma.mealLog.findMany({
        orderBy: { cookedAt: 'desc' },
    })

    return <MealLogContent mealLogs={mealLogs} />
}
