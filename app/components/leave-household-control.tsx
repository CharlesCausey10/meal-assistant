'use client'

import { useState } from 'react'
import { leaveAndCopyHousehold } from '../actions-households'
import { ResponsiveModal } from './responsive-modal'

export function LeaveHouseholdControl() {
    const [isOpen, setIsOpen] = useState(false)
    const [copyMeals, setCopyMeals] = useState(true)
    const [copyMealLogs, setCopyMealLogs] = useState(true)

    function updateCopyMeals(nextCopyMeals: boolean) {
        setCopyMeals(nextCopyMeals)
        if (!nextCopyMeals) {
            setCopyMealLogs(false)
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="min-h-10 rounded-lg border border-danger/30 px-4 text-sm font-semibold text-danger hover:text-danger-hover"
            >
                Leave household
            </button>

            <ResponsiveModal title="Leave household" isOpen={isOpen} onClose={() => setIsOpen(false)}>
                <form action={leaveAndCopyHousehold} className="flex flex-col gap-4">
                    <p className="text-sm text-app-muted">
                        Start your own household. Choose what to bring with you before leaving.
                    </p>

                    <label className="flex items-start gap-3 rounded-lg border border-app-border bg-app-surface px-3 py-3">
                        <input
                            type="checkbox"
                            name="copyMeals"
                            checked={copyMeals}
                            onChange={(event) => updateCopyMeals(event.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-app-border text-primary"
                        />
                        <span>
                            <span className="block text-sm font-semibold text-app-text">
                                Copy meals, ingredients, and preferences
                            </span>
                            <span className="mt-1 block text-sm text-app-muted">
                                Bring over meal templates, ingredient records, and your 1-10 meal scores.
                            </span>
                        </span>
                    </label>

                    <label className="flex items-start gap-3 rounded-lg border border-app-border bg-app-surface px-3 py-3">
                        <input
                            type="checkbox"
                            name="copyMealLogs"
                            checked={copyMealLogs}
                            disabled={!copyMeals}
                            onChange={(event) => setCopyMealLogs(event.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-app-border text-primary disabled:opacity-50"
                        />
                        <span className={!copyMeals ? 'opacity-60' : undefined}>
                            <span className="block text-sm font-semibold text-app-text">
                                Copy meal log
                            </span>
                            <span className="mt-1 block text-sm text-app-muted">
                                Keep cooked-meal history so dashboard recommendations can continue from it.
                            </span>
                        </span>
                    </label>

                    <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="min-h-10 rounded-lg border border-app-border px-4 text-sm font-semibold text-app-text hover:bg-app-surface-soft"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="min-h-10 rounded-lg bg-danger px-4 text-sm font-semibold text-white hover:bg-danger-hover"
                        >
                            Leave household
                        </button>
                    </div>
                </form>
            </ResponsiveModal>
        </>
    )
}
