import Link from 'next/link'
import { withAuth } from '@workos-inc/authkit-nextjs'
import { acceptHouseholdInvite } from '@/app/actions-households'
import { prisma } from '@/lib/prisma'

export default async function InvitePage({
    params,
}: {
    params: Promise<{ token: string }>
}) {
    const { token } = await params
    const household = await prisma.household.findUnique({
        where: { inviteToken: token },
        select: {
            id: true,
            name: true,
            workosOrganizationId: true,
        },
    })
    const auth = await withAuth()

    if (!household?.workosOrganizationId) {
        return (
            <main className="flex min-h-dvh items-center justify-center bg-app-bg p-4 text-app-text">
                <section className="w-full max-w-md rounded-lg border border-app-border bg-app-surface p-5">
                    <h1 className="text-xl font-semibold">Invite unavailable</h1>
                    <p className="mt-2 text-sm text-app-muted">
                        This household invite link is no longer valid.
                    </p>
                    <Link
                        href="/"
                        className="mt-4 inline-block text-sm font-semibold text-primary hover:text-primary-text"
                    >
                        Go home
                    </Link>
                </section>
            </main>
        )
    }

    if (!auth.user) {
        return (
            <main className="flex min-h-dvh items-center justify-center bg-app-bg p-4 text-app-text">
                <section className="w-full max-w-md rounded-lg border border-app-border bg-app-surface p-5">
                    <p className="text-sm font-semibold text-app-muted">Household invite</p>
                    <h1 className="mt-1 text-xl font-semibold">{household.name}</h1>
                    <p className="mt-2 text-sm text-app-muted">
                        Sign in to join this household.
                    </p>
                    <Link
                        href={`/login?returnPathname=/invite/${encodeURIComponent(token)}`}
                        className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-contrast hover:bg-primary-hover"
                    >
                        Sign in
                    </Link>
                </section>
            </main>
        )
    }

    const localUser = await prisma.user.findUnique({
        where: { workosUserId: auth.user.id },
        select: { id: true },
    })
    const existingMembership = localUser
        ? await prisma.householdMember.findUnique({
            where: { userId: localUser.id },
            include: { household: true },
        })
        : null
    const alreadyInHousehold = existingMembership?.householdId === household.id

    return (
        <main className="flex min-h-dvh items-center justify-center bg-app-bg p-4 text-app-text">
            <section className="w-full max-w-md rounded-lg border border-app-border bg-app-surface p-5">
                <p className="text-sm font-semibold text-app-muted">Household invite</p>
                <h1 className="mt-1 text-xl font-semibold">{household.name}</h1>
                <p className="mt-2 text-sm text-app-muted">
                    You are signed in as {auth.user.email}.
                </p>

                {alreadyInHousehold ? (
                    <Link
                        href="/"
                        className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-contrast hover:bg-primary-hover"
                    >
                        Open household
                    </Link>
                ) : (
                    <>
                        {existingMembership ? (
                            <p className="mt-3 rounded-lg border border-warning/30 bg-warning-soft px-3 py-2 text-sm text-app-text">
                                Joining will move you out of {existingMembership.household.name}. If you are the
                                only member there, that household will be deleted.
                            </p>
                        ) : null}
                        <form action={acceptHouseholdInvite} className="mt-4">
                            <input type="hidden" name="token" value={token} />
                            <button
                                type="submit"
                                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-contrast hover:bg-primary-hover"
                            >
                                Join household
                            </button>
                        </form>
                    </>
                )}
            </section>
        </main>
    )
}
