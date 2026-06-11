import Link from 'next/link'
import { HouseholdRole } from '@prisma/client'
import { getAuthenticatedContext } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
    linkCurrentHouseholdToWorkOS,
    removeHouseholdMember,
    updateDiscoverableMealsOptIn,
} from '../actions-households'
import { HouseholdInviteLink } from '../components/household-invite-link'
import { LeaveHouseholdControl } from '../components/leave-household-control'

export default async function HouseholdsPage() {
    const authContext = await getAuthenticatedContext()
    const currentHouseholdMembers = await prisma.householdMember.findMany({
        where: { householdId: authContext.household.id },
        include: { user: true },
        orderBy: [
            { role: 'asc' },
            { createdAt: 'asc' },
        ],
    })
    const canLinkCurrentHousehold =
        authContext.role === HouseholdRole.OWNER &&
        authContext.household.workosOrganizationId === null
    const isCurrentOwner = authContext.role === HouseholdRole.OWNER
    const isCurrentMember = authContext.role === HouseholdRole.MEMBER

    return (
        <main className="min-h-dvh bg-app-bg p-4 text-app-text md:p-6">
            <div className="mx-auto flex max-w-3xl flex-col gap-6">
                <header className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold text-app-muted">Account</p>
                        <h1 className="text-2xl font-semibold">Household</h1>
                    </div>
                    <Link
                        href="/"
                        className="rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm font-semibold text-primary hover:text-primary-text"
                    >
                        Back
                    </Link>
                </header>

                {canLinkCurrentHousehold ? (
                    <section className="rounded-lg border border-primary/25 bg-app-surface p-4">
                        <h2 className="text-base font-semibold">Finish setup</h2>
                        <p className="mt-1 text-sm text-app-muted">
                            Link this household to WorkOS so it can support invitations.
                        </p>
                        <form action={linkCurrentHouseholdToWorkOS} className="mt-4">
                            <button
                                type="submit"
                                className="min-h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-contrast hover:bg-primary-hover"
                            >
                                Link household
                            </button>
                        </form>
                    </section>
                ) : null}

                <section className="rounded-lg border border-app-border bg-app-surface p-4">
                    <h2 className="text-base font-semibold">Your household</h2>
                    <p className="mt-1 text-sm text-app-muted">
                        You are {isCurrentOwner ? 'the owner' : 'a member'}.
                    </p>
                </section>

                {isCurrentOwner && authContext.household.workosOrganizationId ? (
                    <section className="rounded-lg border border-app-border bg-app-surface p-4">
                        <div>
                            <h2 className="text-base font-semibold">Invite link</h2>
                            <p className="mt-1 text-sm text-app-muted">
                                Create or refresh this link, then send it to anyone you want in this household.
                            </p>
                        </div>
                        <div className="mt-4">
                            <HouseholdInviteLink token={authContext.household.inviteToken} />
                        </div>
                    </section>
                ) : null}

                <section className="rounded-lg border border-app-border bg-app-surface p-4">
                    <h2 className="text-base font-semibold">Discover sharing</h2>
                    <p className="mt-1 text-sm text-app-muted">
                        Discover will only use meal templates. It will not share meal logs, grocery lists,
                        member names, household names, or preference scores.
                    </p>
                    <p className="mt-3 text-sm font-semibold text-app-text">
                        {authContext.household.discoverableMealsOptIn === null
                            ? 'Not decided yet'
                            : authContext.household.discoverableMealsOptIn
                                ? 'Allowed'
                                : 'Private'}
                    </p>
                    {isCurrentOwner ? (
                        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
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
                        <p className="mt-3 text-sm text-app-muted">
                            The household owner controls this setting.
                        </p>
                    )}
                </section>

                <section className="rounded-lg border border-app-border bg-app-surface p-4">
                    <h2 className="text-base font-semibold">Members</h2>
                    <div className="mt-3 divide-y divide-app-border">
                        {currentHouseholdMembers.map((membership) => {
                            const canRemove =
                                isCurrentOwner &&
                                membership.userId !== authContext.user.id

                            return (
                                <div
                                    key={membership.id}
                                    className="flex items-center justify-between gap-4 py-3"
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
                </section>

                {isCurrentMember ? (
                    <section className="rounded-lg border border-app-border bg-app-surface p-4">
                        <h2 className="text-base font-semibold">Leave household</h2>
                        <p className="mt-1 text-sm text-app-muted">
                            Start your own household and choose what to bring with you.
                        </p>
                        <div className="mt-4">
                            <LeaveHouseholdControl />
                        </div>
                    </section>
                ) : null}
            </div>
        </main>
    )
}
