import { randomBytes } from 'crypto'
import { prisma } from './prisma'

export function createInviteToken(): string {
    return randomBytes(32).toString('base64url')
}

export async function ensureHouseholdInviteToken(householdId: number): Promise<string> {
    const household = await prisma.household.findUnique({
        where: { id: householdId },
        select: { inviteToken: true },
    })

    if (household?.inviteToken) {
        return household.inviteToken
    }

    const updatedHousehold = await prisma.household.update({
        where: { id: householdId },
        data: {
            inviteToken: createInviteToken(),
            inviteTokenCreatedAt: new Date(),
        },
        select: { inviteToken: true },
    })

    return updatedHousehold.inviteToken!
}
