import { getWorkOS } from '@workos-inc/authkit-nextjs'

function isNotFoundError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : ''

    return message.toLowerCase().includes('not found')
}

export async function deleteWorkOSOrganization(organizationId: string | null) {
    if (!organizationId) {
        return
    }

    try {
        await getWorkOS().organizations.deleteOrganization(organizationId)
    } catch (error) {
        if (!isNotFoundError(error)) {
            throw error
        }
    }
}

export async function removeWorkOSOrganizationMembership(
    organizationId: string,
    workosUserId: string
) {
    const workos = getWorkOS()
    const memberships = await workos.userManagement.listOrganizationMemberships({
        organizationId,
        userId: workosUserId,
    })

    for (const membership of await memberships.autoPagination()) {
        try {
            await workos.userManagement.deleteOrganizationMembership(membership.id)
        } catch (error) {
            if (!isNotFoundError(error)) {
                throw error
            }
        }
    }
}

export async function ensureOnlyWorkOSOrganizationMembership(
    workosUserId: string,
    targetOrganizationId: string
) {
    const workos = getWorkOS()
    const memberships = await workos.userManagement.listOrganizationMemberships({
        userId: workosUserId,
    })
    const existingMemberships = await memberships.autoPagination()
    const hasTargetMembership = existingMemberships.some(
        (membership) => membership.organizationId === targetOrganizationId
    )

    if (!hasTargetMembership) {
        try {
            await workos.userManagement.createOrganizationMembership({
                organizationId: targetOrganizationId,
                userId: workosUserId,
            })
        } catch (error) {
            const message = error instanceof Error ? error.message : ''

            if (!message.toLowerCase().includes('already')) {
                throw error
            }
        }
    }

    for (const membership of existingMemberships) {
        if (membership.organizationId === targetOrganizationId) {
            continue
        }

        try {
            await workos.userManagement.deleteOrganizationMembership(membership.id)
        } catch (error) {
            if (!isNotFoundError(error)) {
                throw error
            }
        }
    }
}
