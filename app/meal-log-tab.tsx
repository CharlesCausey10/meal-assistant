import { prisma } from '@/lib/prisma'
import { MealLogContent } from './meal-log-content'

export async function MealLogTab() {
    const mealLogs = await prisma.mealLog.findMany({
        where: { isActive: true },
        orderBy: { cookedAt: 'desc' },
    })

    return <MealLogContent mealLogs={mealLogs} />
}
