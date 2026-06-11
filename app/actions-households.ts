'use server'

import { getWorkOS, refreshSession } from '@workos-inc/authkit-nextjs'
import { HouseholdRole } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { withAuth } from '@workos-inc/authkit-nextjs'
import { getAuthenticatedActionContext, upsertUserFromWorkOS } from '@/lib/auth'
import { copyMealLogsToHousehold, copyMealsAndIngredientsToHousehold } from '@/lib/household-copy'
import { createInviteToken, ensureHouseholdInviteToken } from '@/lib/household-invites'
import { prisma } from '@/lib/prisma'

function getHouseholdName(formData: FormData): string | null {
    const name = String(formData.get('name') || '').trim()
    return name.length > 0 ? name : null
}

function getDefaultHouseholdName(user: { firstName: string | null }): string {
    return user.firstName ? `${user.firstName}'s Household` : 'My Household'
}

async function removeWorkOSOrganizationMembership(organizationId: string, workosUserId: string) {
    const workos = getWorkOS()
    const memberships = await workos.userManagement.listOrganizationMemberships({
        organizationId,
        userId: workosUserId,
    })

    for (const membership of memberships.data) {
        await workos.userManagement.deleteOrganizationMembership(membership.id)
    }
}

async function deleteWorkOSOrganization(organizationId: string | null) {
    if (!organizationId) {
        return
    }

    try {
        await getWorkOS().organizations.deleteOrganization(organizationId)
    } catch (error) {
        const message = error instanceof Error ? error.message : ''
        if (!message.toLowerCase().includes('not found')) {
            throw error
        }
    }
}

async function getLeavePlan(userId: number, householdId: number) {
    const [membership, memberCount] = await Promise.all([
        prisma.householdMember.findUnique({
            where: { userId },
            include: { household: true },
        }),
        prisma.householdMember.count({
            where: { householdId },
        }),
    ])

    if (!membership || membership.householdId !== householdId) {
        throw new Error('You are not a member of this household.')
    }

    if (membership.role === HouseholdRole.OWNER && memberCount > 1) {
        throw new Error('Remove other household members before leaving this household.')
    }

    return {
        membership,
        deleteOldHousehold: memberCount === 1,
        oldWorkOSOrganizationId: membership.household.workosOrganizationId,
    }
}

async function moveUserToHousehold(params: {
    userId: number
    fromMembershipId: number
    fromHouseholdId: number
    toHouseholdId: number
    deleteOldHousehold: boolean
}) {
    await prisma.$transaction(async (tx) => {
        await tx.householdMember.delete({
            where: { id: params.fromMembershipId },
        })

        if (params.deleteOldHousehold) {
            await tx.household.delete({
                where: { id: params.fromHouseholdId },
            })
        }

        await tx.householdMember.create({
            data: {
                householdId: params.toHouseholdId,
                userId: params.userId,
                role: HouseholdRole.OWNER,
            },
        })
    })
}

export async function linkCurrentHouseholdToWorkOS(formData: FormData) {
    const { user, household, role } = await getAuthenticatedActionContext()

    if (role !== HouseholdRole.OWNER) {
        throw new Error('Only household owners can link a household to WorkOS.')
    }

    if (household.workosOrganizationId) {
        await refreshSession({ organizationId: household.workosOrganizationId })
        revalidatePath('/')
        redirect('/')
    }

    const name = getHouseholdName(formData) ?? household.name
    const workos = getWorkOS()
    const organization = await workos.organizations.createOrganization({
        name,
        metadata: {
            localHouseholdId: String(household.id),
        },
    })

    await workos.userManagement.createOrganizationMembership({
        organizationId: organization.id,
        userId: user.workosUserId,
    })

    await prisma.household.update({
        where: { id: household.id },
        data: {
            name,
            workosOrganizationId: organization.id,
        },
    })

    await ensureHouseholdInviteToken(household.id)
    await refreshSession({ organizationId: organization.id })
    revalidatePath('/')
    redirect('/')
}

export async function leaveAndCopyHousehold(formData: FormData) {
    const { user, household, role } = await getAuthenticatedActionContext()

    if (role === HouseholdRole.OWNER) {
        throw new Error('Household owners do not need to leave and copy their own household.')
    }

    const shouldCopyMeals = formData.get('copyMeals') === 'on'
    const shouldCopyMealLogs = shouldCopyMeals && formData.get('copyMealLogs') === 'on'
    const name = getDefaultHouseholdName(user)
    const leavePlan = await getLeavePlan(user.id, household.id)
    const workos = getWorkOS()
    const organization = await workos.organizations.createOrganization({
        name,
    })

    await workos.userManagement.createOrganizationMembership({
        organizationId: organization.id,
        userId: user.workosUserId,
    })

    const forkedHousehold = await prisma.household.create({
        data: {
            name,
            workosOrganizationId: organization.id,
        },
    })
    let movedToNewHousehold = false

    try {
        await ensureHouseholdInviteToken(forkedHousehold.id)
        const mealIdMap = shouldCopyMeals
            ? await copyMealsAndIngredientsToHousehold(household.id, forkedHousehold.id, user.id)
            : new Map<number, number>()

        if (shouldCopyMealLogs) {
            await copyMealLogsToHousehold(household.id, forkedHousehold.id, mealIdMap)
        }

        await moveUserToHousehold({
            userId: user.id,
            fromMembershipId: leavePlan.membership.id,
            fromHouseholdId: household.id,
            toHouseholdId: forkedHousehold.id,
            deleteOldHousehold: leavePlan.deleteOldHousehold,
        })
        movedToNewHousehold = true

        if (leavePlan.deleteOldHousehold) {
            await deleteWorkOSOrganization(leavePlan.oldWorkOSOrganizationId)
        } else if (leavePlan.oldWorkOSOrganizationId) {
            await removeWorkOSOrganizationMembership(leavePlan.oldWorkOSOrganizationId, user.workosUserId)
        }
    } catch (error) {
        if (!movedToNewHousehold) {
            await prisma.household.delete({
                where: { id: forkedHousehold.id },
            }).catch(() => undefined)
            await deleteWorkOSOrganization(organization.id)
        }

        throw error
    }

    await refreshSession({ organizationId: organization.id })
    revalidatePath('/')
    redirect('/')
}

export async function refreshHouseholdInviteLink(): Promise<string> {
    const { household, role } = await getAuthenticatedActionContext()

    if (role !== HouseholdRole.OWNER) {
        throw new Error('Only household owners can refresh invite links.')
    }

    const updatedHousehold = await prisma.household.update({
        where: { id: household.id },
        data: {
            inviteToken: createInviteToken(),
            inviteTokenCreatedAt: new Date(),
        },
        select: { inviteToken: true },
    })

    revalidatePath('/households')

    return updatedHousehold.inviteToken!
}

export async function updateDiscoverableMealsOptIn(formData: FormData) {
    const { household, role } = await getAuthenticatedActionContext()

    if (role !== HouseholdRole.OWNER) {
        throw new Error('Only household owners can change Discover sharing.')
    }

    const value = String(formData.get('discoverableMealsOptIn') || '')
    if (value !== 'true' && value !== 'false') {
        throw new Error('Choose whether this household can share meals with Discover.')
    }

    await prisma.household.update({
        where: { id: household.id },
        data: { discoverableMealsOptIn: value === 'true' },
    })

    revalidatePath('/')
    revalidatePath('/households')
}

export async function acceptHouseholdInvite(formData: FormData) {
    const token = String(formData.get('token') || '')
    const auth = await withAuth()

    if (!auth.user) {
        redirect(`/login?returnPathname=/invite/${encodeURIComponent(token)}`)
    }

    const household = await prisma.household.findUnique({
        where: { inviteToken: token },
    })

    if (!household?.workosOrganizationId) {
        throw new Error('This invite link is no longer valid.')
    }

    const user = await upsertUserFromWorkOS(auth.user)
    const currentMembership = await prisma.householdMember.findUnique({
        where: { userId: user.id },
        include: { household: true },
    })

    if (currentMembership?.householdId === household.id) {
        await refreshSession({ organizationId: household.workosOrganizationId })
        revalidatePath('/')
        redirect('/')
    }

    const leavePlan = currentMembership
        ? await getLeavePlan(user.id, currentMembership.householdId)
        : null

    const workos = getWorkOS()

    try {
        await workos.userManagement.createOrganizationMembership({
            organizationId: household.workosOrganizationId,
            userId: auth.user.id,
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : ''
        if (!message.toLowerCase().includes('already')) {
            throw error
        }
    }

    if (leavePlan) {
        await prisma.$transaction(async (tx) => {
            await tx.householdMember.delete({
                where: { id: leavePlan.membership.id },
            })

            if (leavePlan.deleteOldHousehold) {
                await tx.household.delete({
                    where: { id: leavePlan.membership.householdId },
                })
            }

            await tx.householdMember.create({
                data: {
                    householdId: household.id,
                    userId: user.id,
                    role: HouseholdRole.MEMBER,
                },
            })
        })

        if (leavePlan.deleteOldHousehold) {
            await deleteWorkOSOrganization(leavePlan.oldWorkOSOrganizationId)
        } else if (leavePlan.oldWorkOSOrganizationId) {
            await removeWorkOSOrganizationMembership(leavePlan.oldWorkOSOrganizationId, auth.user.id)
        }
    } else {
        await prisma.householdMember.create({
            data: {
                householdId: household.id,
                userId: user.id,
                role: HouseholdRole.MEMBER,
            },
        })
    }

    await refreshSession({ organizationId: household.workosOrganizationId })
    revalidatePath('/')
    redirect('/')
}

export async function removeHouseholdMember(formData: FormData) {
    const { household, user, role } = await getAuthenticatedActionContext()

    if (role !== HouseholdRole.OWNER) {
        throw new Error('Only household owners can remove members.')
    }

    const memberId = parseInt(String(formData.get('memberId') || ''), 10)
    if (!memberId || Number.isNaN(memberId) || memberId === user.id) {
        return
    }

    const membership = await prisma.householdMember.findFirst({
        where: {
            householdId: household.id,
            userId: memberId,
        },
        include: { user: true },
    })

    if (!membership) {
        return
    }

    const personalHouseholdName = getDefaultHouseholdName(membership.user)
    const workos = getWorkOS()
    const organization = await workos.organizations.createOrganization({
        name: personalHouseholdName,
    })

    await workos.userManagement.createOrganizationMembership({
        organizationId: organization.id,
        userId: membership.user.workosUserId,
    })

    const personalHousehold = await prisma.household.create({
        data: {
            name: personalHouseholdName,
            workosOrganizationId: organization.id,
        },
    })

    await ensureHouseholdInviteToken(personalHousehold.id)
    await copyMealsAndIngredientsToHousehold(household.id, personalHousehold.id, membership.userId)

    if (household.workosOrganizationId) {
        await removeWorkOSOrganizationMembership(household.workosOrganizationId, membership.user.workosUserId)
    }

    await prisma.$transaction(async (tx) => {
        await tx.householdMember.delete({
            where: { id: membership.id },
        })
        await tx.householdMember.create({
            data: {
                householdId: personalHousehold.id,
                userId: membership.userId,
                role: HouseholdRole.OWNER,
            },
        })
    })

    revalidatePath('/households')
}
