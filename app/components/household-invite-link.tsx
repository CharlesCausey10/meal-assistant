'use client'

import { useMemo, useState, useTransition } from 'react'
import { refreshHouseholdInviteLink } from '../actions-households'
import { Toast } from './toast'

export function HouseholdInviteLink({ token }: { token: string | null }) {
    const [currentToken, setCurrentToken] = useState(token)
    const [toastMessage, setToastMessage] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const inviteUrl = useMemo(() => {
        if (!currentToken) {
            return ''
        }

        if (typeof window === 'undefined') {
            return `/invite/${currentToken}`
        }

        return `${window.location.origin}/invite/${currentToken}`
    }, [currentToken])

    async function copyInviteLink(nextToken: string, message = 'Invite link copied') {
        const nextInviteUrl = `${window.location.origin}/invite/${nextToken}`
        await navigator.clipboard.writeText(nextInviteUrl)
        setToastMessage(message)
    }

    function refreshAndCopy() {
        startTransition(async () => {
            const nextToken = await refreshHouseholdInviteLink()
            setCurrentToken(nextToken)
            await copyInviteLink(nextToken, currentToken ? 'Invite link refreshed and copied' : 'Invite link created and copied')
        })
    }

    return (
        <>
            <div className="flex flex-col gap-2 sm:flex-row">
                {currentToken ? (
                    <input
                        value={inviteUrl}
                        readOnly
                        className="min-h-10 flex-1 rounded-lg border border-app-border bg-app-surface-soft px-3 text-sm text-app-muted"
                        aria-label="Household invite link"
                    />
                ) : null}
                <div className="flex flex-col gap-2 sm:flex-row">
                    {currentToken ? (
                        <button
                            type="button"
                            onClick={() => copyInviteLink(currentToken)}
                            className="min-h-10 rounded-lg border border-app-border bg-app-surface px-4 text-sm font-semibold text-app-text hover:bg-app-surface-soft"
                        >
                            Copy
                        </button>
                    ) : null}
                    <button
                        type="button"
                        onClick={refreshAndCopy}
                        disabled={isPending}
                        className="min-h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-contrast hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {currentToken ? (isPending ? 'Refreshing...' : 'Refresh') : (isPending ? 'Creating...' : 'Create link')}
                    </button>
                </div>
            </div>
            {toastMessage ? <Toast message={toastMessage} onClose={() => setToastMessage(null)} /> : null}
        </>
    )
}
