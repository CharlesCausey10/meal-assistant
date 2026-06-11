import { getWorkOS, withAuth } from '@workos-inc/authkit-nextjs'
import type { User as WorkOSUser } from '@workos-inc/node'
import { HouseholdRole } from '@prisma/client'
import { redirect } from 'next/navigation'
import { copyGlobalIngredientsToHousehold } from './household-copy'
import { prisma } from './prisma'
import { ensureHouseholdInviteToken } from './household-invites'

export type AuthenticatedContext = {
    user: {
        id: number
        workosUserId: string
        email: string
        firstName: string | null
        lastName: string | null
    }
    household: {
        id: number
        name: string
        workosOrganizationId: string | null
        inviteToken: string | null
        inviteTokenCreatedAt: Date | null
        discoverableMealsOptIn: boolean | null
    }
    role: HouseholdRole
}

async function getBootstrapHousehold() {
    const existingPersonalHousehold = await prisma.household.findFirst({
        where: { name: 'Personal Household' },
        orderBy: { id: 'asc' },
    })

    if (existingPersonalHousehold) {
        return existingPersonalHousehold
    }

    return prisma.household.findFirst({
        orderBy: { id: 'asc' },
    })
}

async function syncUserAndMembership(
    workosUser: WorkOSUser,
    organizationId: string | undefined
): Promise<AuthenticatedContext> {
    const user = await prisma.user.upsert({
        where: { workosUserId: workosUser.id },
        update: {
            email: workosUser.email,
            firstName: workosUser.firstName,
            lastName: workosUser.lastName,
        },
        create: {
            workosUserId: workosUser.id,
            email: workosUser.email,
            firstName: workosUser.firstName,
            lastName: workosUser.lastName,
        },
    })

    const existingMembership = await prisma.householdMember.findUnique({
        where: { userId: user.id },
        include: { household: true },
    })

    if (existingMembership) {
        return {
            user,
            household: existingMembership.household,
            role: existingMembership.role,
        }
    }

    let createdHousehold = false
    const household = organizationId
        ? await prisma.household.findUnique({
            where: { workosOrganizationId: organizationId },
        }) ?? await prisma.household.create({
            data: {
                name: 'Household',
                workosOrganizationId: organizationId,
            },
        }).then((created) => {
            createdHousehold = true
            return created
        })
        : await getBootstrapHousehold()

    if (!household) {
        throw new Error('No household exists for the authenticated user.')
    }

    if (createdHousehold) {
        await copyGlobalIngredientsToHousehold(household.id)
    }

    const existingHouseholdMemberCount = await prisma.householdMember.count({
        where: { householdId: household.id },
    })
    const role = existingHouseholdMemberCount === 0 ? HouseholdRole.OWNER : HouseholdRole.MEMBER

    const membership = await prisma.householdMember.create({
        data: {
            householdId: household.id,
            userId: user.id,
            role,
        },
    })

    return {
        user,
        household,
        role: membership.role,
    }
}

async function createFirstHouseholdForUser(workosUser: WorkOSUser): Promise<AuthenticatedContext> {
    const user = await prisma.user.upsert({
        where: { workosUserId: workosUser.id },
        update: {
            email: workosUser.email,
            firstName: workosUser.firstName,
            lastName: workosUser.lastName,
        },
        create: {
            workosUserId: workosUser.id,
            email: workosUser.email,
            firstName: workosUser.firstName,
            lastName: workosUser.lastName,
        },
    })
    const householdName = workosUser.firstName
        ? `${workosUser.firstName}'s Household`
        : 'My Household'
    const workos = getWorkOS()
    const organization = await workos.organizations.createOrganization({
        name: householdName,
    })

    await workos.userManagement.createOrganizationMembership({
        organizationId: organization.id,
        userId: workosUser.id,
    })

    const household = await prisma.household.create({
        data: {
            name: householdName,
            workosOrganizationId: organization.id,
            members: {
                create: {
                    userId: user.id,
                    role: HouseholdRole.OWNER,
                },
            },
        },
    })

    await ensureHouseholdInviteToken(household.id)
    await copyGlobalIngredientsToHousehold(household.id)

    return {
        user,
        household,
        role: HouseholdRole.OWNER,
    }
}

async function getLocalAuthenticatedContext(
    workosUser: WorkOSUser
): Promise<AuthenticatedContext | null> {
    const user = await prisma.user.findUnique({
        where: { workosUserId: workosUser.id },
        include: {
            memberships: {
                include: { household: true },
                orderBy: { id: 'asc' },
            },
        },
    })

    const membership = user?.memberships[0]

    if (!user || !membership) {
        return null
    }

    return {
        user,
        household: membership.household,
        role: membership.role,
    }
}

export async function getAuthenticatedContext(): Promise<AuthenticatedContext> {
    const { user, organizationId } = await withAuth()

    if (!user) {
        redirect('/login')
    }

    const localContext = await getLocalAuthenticatedContext(user)
    if (localContext) {
        return localContext
    }

    return organizationId
        ? syncUserAndMembership(user, organizationId)
        : createFirstHouseholdForUser(user)
}

export async function getAuthenticatedActionContext(): Promise<AuthenticatedContext> {
    const { user, organizationId } = await withAuth()

    if (!user) {
        redirect('/login')
    }

    const localContext = await getLocalAuthenticatedContext(user)
    if (localContext) {
        return localContext
    }

    return organizationId
        ? syncUserAndMembership(user, organizationId)
        : createFirstHouseholdForUser(user)
}

export async function syncAuthenticatedUser(
    user: WorkOSUser,
    organizationId?: string
): Promise<void> {
    await syncUserAndMembership(user, organizationId)
}
