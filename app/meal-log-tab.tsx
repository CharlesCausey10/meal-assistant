import { prisma } from '@/lib/prisma'
import { MealLogContent } from './meal-log-content'

export async function MealLogTab({ householdId }: { householdId: number }) {
    const mealLogs = await prisma.mealLog.findMany({
        where: { householdId, isActive: true },
        orderBy: { cookedAt: 'desc' },
    })

    return <MealLogContent mealLogs={mealLogs} />
}
