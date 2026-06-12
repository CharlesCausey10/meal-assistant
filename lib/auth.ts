import { getWorkOS, withAuth } from '@workos-inc/authkit-nextjs'
import type { User as WorkOSUser } from '@workos-inc/node'
import { HouseholdRole } from '@prisma/client'
import { redirect } from 'next/navigation'
import { copyGlobalIngredientsToHousehold } from './household-copy'
import { prisma } from './prisma'
import { ensureHouseholdInviteToken } from './household-invites'
import { ensureOnlyWorkOSOrganizationMembership } from './workos-memberships'

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

export async function upsertUserFromWorkOS(workosUser: WorkOSUser) {
    const userData = {
        email: workosUser.email,
        firstName: workosUser.firstName,
        lastName: workosUser.lastName,
    }
    const userByWorkOSId = await prisma.user.findUnique({
        where: { workosUserId: workosUser.id },
    })

    if (userByWorkOSId) {
        return prisma.user.update({
            where: { id: userByWorkOSId.id },
            data: userData,
        })
    }

    const userByEmail = await prisma.user.findUnique({
        where: { email: workosUser.email },
    })

    if (userByEmail) {
        return prisma.user.update({
            where: { id: userByEmail.id },
            data: {
                ...userData,
                workosUserId: workosUser.id,
            },
        })
    }

    return prisma.user.create({
        data: {
            ...userData,
            workosUserId: workosUser.id,
        },
    })
}

async function syncUserAndMembership(
    workosUser: WorkOSUser,
    organizationId: string | undefined
): Promise<AuthenticatedContext> {
    const user = await upsertUserFromWorkOS(workosUser)

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
    const user = await upsertUserFromWorkOS(workosUser)
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
    await ensureOnlyWorkOSOrganizationMembership(workosUser.id, organization.id)

    return {
        user,
        household,
        role: HouseholdRole.OWNER,
    }
}

async function getLocalAuthenticatedContext(
    workosUser: WorkOSUser
): Promise<AuthenticatedContext | null> {
    const membership = await prisma.householdMember.findFirst({
        where: {
            user: { workosUserId: workosUser.id },
        },
        include: {
            household: true,
            user: true,
        },
        orderBy: { id: 'asc' },
    })

    if (!membership) {
        return null
    }

    return {
        user: membership.user,
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

export async function getOptionalAuthenticatedContext(): Promise<AuthenticatedContext | null> {
    const { user, organizationId } = await withAuth()

    if (!user) {
        return null
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
    const context = await syncUserAndMembership(user, organizationId)

    if (context.household.workosOrganizationId) {
        await ensureOnlyWorkOSOrganizationMembership(
            user.id,
            context.household.workosOrganizationId
        )
    }
}
