'use client'

import { useState } from 'react'
import { setMealTaste } from '../actions'
import { PreferenceInput } from './preference-input'
import { ResponsiveModal } from './responsive-modal'

export function RateMealControl({
    mealId,
    mealName,
}: {
    mealId: number
    mealName: string
}) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="min-h-9 rounded-lg border border-app-border bg-app-surface px-3 text-sm font-semibold text-app-text hover:bg-app-surface-soft"
            >
                Rate this meal
            </button>
            <ResponsiveModal title={'Rate ' + mealName} isOpen={isOpen} onClose={() => setIsOpen(false)}>
                <form
                    action={async (formData) => {
                        await setMealTaste(formData)
                        setIsOpen(false)
                    }}
                    className="space-y-4"
                >
                    <input type="hidden" name="mealId" value={mealId} />
                    <PreferenceInput padSize="lg" className="mx-auto max-w-max" />
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="min-h-10 flex-1 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-contrast hover:bg-primary-hover"
                        >
                            Save rating
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="min-h-10 rounded-lg border border-app-border px-4 text-sm font-semibold text-app-text hover:bg-app-surface-soft"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </ResponsiveModal>
        </>
    )
}
