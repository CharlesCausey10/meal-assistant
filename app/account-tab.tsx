import Link from 'next/link'
import { HouseholdRole } from '@prisma/client'
import { getAuthenticatedContext, type AuthenticatedContext } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { measureAsync } from '@/lib/timing'
import {
    linkCurrentHouseholdToWorkOS,
    removeHouseholdMember,
    updateDiscoverableMealsOptIn,
} from './actions-households'
import { HouseholdInviteLink } from './components/household-invite-link'
import { LeaveHouseholdControl } from './components/leave-household-control'

export async function AccountTab({
    authContext: providedAuthContext,
    showBackLink = false,
}: {
    authContext?: AuthenticatedContext
    showBackLink?: boolean
}) {
    const authContext = providedAuthContext ?? await measureAsync(
        'tab.account.auth',
        () => getAuthenticatedContext(),
        { tab: 'account' }
    )
    const currentHouseholdMembers = await measureAsync(
        'tab.account.queries',
        () => prisma.householdMember.findMany({
            where: { householdId: authContext.household.id },
            include: { user: true },
            orderBy: [
                { role: 'asc' },
                { createdAt: 'asc' },
            ],
        }),
        { tab: 'account' }
    )
    const canLinkCurrentHousehold =
        authContext.role === HouseholdRole.OWNER &&
        authContext.household.workosOrganizationId === null
    const isCurrentOwner = authContext.role === HouseholdRole.OWNER
    const isCurrentMember = authContext.role === HouseholdRole.MEMBER

    return (
        <div className="h-full overflow-y-auto p-3 pb-4 md:p-4">
            <div className="mx-auto flex max-w-3xl flex-col gap-3">
                <header className="flex items-start justify-between gap-4 px-1">
                    <div>
                        <p className="text-sm font-semibold text-app-muted">Account</p>
                        <h1 className="mt-1 text-2xl font-semibold leading-tight text-app-text">
                            Household settings
                        </h1>
                    </div>
                    {showBackLink ? (
                        <Link
                            href="/"
                            className="rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm font-semibold text-primary hover:text-primary-text"
                        >
                            Back
                        </Link>
                    ) : null}
                </header>

                <section className="rounded-lg border border-app-border bg-app-surface p-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-base font-semibold">Profile</h2>
                            <p className="mt-1 text-sm text-app-muted">
                                Signed in as <span className="font-semibold text-app-text">{authContext.user.email}</span>
                            </p>
                        </div>
                        <Link
                            href="/logout"
                            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-app-border px-4 text-sm font-semibold text-app-text hover:bg-app-surface-soft"
                        >
                            Sign out
                        </Link>
                    </div>
                </section>

                <section className="rounded-lg border border-app-border bg-app-surface p-3">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h2 className="text-base font-semibold">Household</h2>
                            <p className="mt-1 text-sm text-app-muted">
                                Household name, role, members, and membership actions.
                            </p>
                        </div>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                        <p className="text-app-muted">
                            Name{' '}
                            <span className="font-semibold text-app-text">{authContext.household.name}</span>
                        </p>
                        <p className="text-app-muted">
                            Role{' '}
                            <span className="font-semibold text-app-text">
                                {isCurrentOwner ? 'Owner' : 'Member'}
                            </span>
                        </p>
                    </div>

                    {canLinkCurrentHousehold ? (
                        <div className="mt-3 rounded-lg border border-primary/25 bg-primary-soft/40 p-3">
                            <h3 className="text-sm font-semibold text-app-text">Finish setup</h3>
                            <p className="mt-1 text-sm text-app-muted">
                                Link this household to WorkOS so it can support invitations.
                            </p>
                            <form action={linkCurrentHouseholdToWorkOS} className="mt-3">
                                <button
                                    type="submit"
                                    className="min-h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-contrast hover:bg-primary-hover"
                                >
                                    Link household
                                </button>
                            </form>
                        </div>
                    ) : null}

                    {isCurrentOwner && authContext.household.workosOrganizationId ? (
                        <div className="mt-3 border-t border-app-border pt-3">
                            <h3 className="text-sm font-semibold text-app-text">Invite link</h3>
                            <p className="mt-1 text-sm text-app-muted">
                                Create or refresh this link, then send it to anyone you want in this household.
                            </p>
                            <div className="mt-3">
                                <HouseholdInviteLink token={authContext.household.inviteToken} />
                            </div>
                        </div>
                    ) : null}

                    <div className="mt-3 border-t border-app-border pt-3">
                        <h3 className="text-sm font-semibold text-app-text">Members</h3>
                        <div className="mt-2 divide-y divide-app-border">
                            {currentHouseholdMembers.map((membership) => {
                                const canRemove =
                                    isCurrentOwner &&
                                    membership.userId !== authContext.user.id

                                return (
                                    <div
                                        key={membership.id}
                                        className="flex items-center justify-between gap-4 py-2"
                                    >
                                        <div className="min-w-0">
                                            <p className="font-semibold text-app-text">
                                                {membership.user.email}
                                            </p>
                                            <p className="text-sm text-app-muted">
                                                {membership.role.toLowerCase()}
                                            </p>
                                        </div>
                                        {canRemove ? (
                                            <form action={removeHouseholdMember}>
                                                <input type="hidden" name="memberId" value={membership.userId} />
                                                <button
                                                    type="submit"
                                                    className="rounded-lg border border-danger/30 px-3 py-2 text-sm font-semibold text-danger hover:text-danger-hover"
                                                >
                                                    Remove
                                                </button>
                                            </form>
                                        ) : null}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="mt-3 border-t border-app-border pt-3">
                        <h3 className="text-sm font-semibold text-app-text">Membership</h3>
                        {isCurrentMember ? (
                            <>
                                <p className="mt-1 text-sm text-app-muted">
                                    Start your own household and choose what to bring with you.
                                </p>
                                <div className="mt-3">
                                    <LeaveHouseholdControl />
                                </div>
                            </>
                        ) : (
                            <p className="mt-1 text-sm text-app-muted">
                                Owners manage invitations and members for this household.
                            </p>
                        )}
                    </div>
                </section>

                <section className="rounded-lg border border-app-border bg-app-surface p-3">
                    <h2 className="text-base font-semibold">Discover sharing</h2>
                    <p className="mt-1 text-sm text-app-muted">
                        Discover will only use meal templates. It will not share meal logs, grocery lists,
                        member names, household names, or preference scores.
                    </p>
                    <p className="mt-2 text-sm font-semibold text-app-text">
                        {authContext.household.discoverableMealsOptIn === null
                            ? 'Not decided yet'
                            : authContext.household.discoverableMealsOptIn
                                ? 'Allowed'
                                : 'Private'}
                    </p>
                    {isCurrentOwner ? (
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                            <form action={updateDiscoverableMealsOptIn}>
                                <input type="hidden" name="discoverableMealsOptIn" value="true" />
                                <button
                                    type="submit"
                                    className="min-h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-contrast hover:bg-primary-hover"
                                >
                                    Allow Discover
                                </button>
                            </form>
                            <form action={updateDiscoverableMealsOptIn}>
                                <input type="hidden" name="discoverableMealsOptIn" value="false" />
                                <button
                                    type="submit"
                                    className="min-h-10 rounded-lg border border-app-border px-4 text-sm font-semibold text-app-text hover:bg-app-surface-soft"
                                >
                                    Keep private
                                </button>
                            </form>
                        </div>
                    ) : (
                        <p className="mt-2 text-sm text-app-muted">
                            The household owner controls this setting.
                        </p>
                    )}
                </section>
            </div>
        </div>
    )
}
