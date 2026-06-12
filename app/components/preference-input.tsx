'use client'

import { useState } from 'react'
import { formatTasteRating } from '../utils/taste'

interface PreferenceInputProps {
    name?: string;
    defaultValue?: number | string;
    className?: string;
    padSize?: 'sm' | 'md' | 'lg';
}

function parseTasteScore(value: number | string): number | null {
    if (value === '') {
        return null
    }

    const parsed = Number(value)

    return Number.isInteger(parsed) && parsed >= 1 && parsed <= 10 ? parsed : null
}

function StarIcon({
    fillPercent,
    size = 'md',
}: {
    fillPercent: number
    size?: 'md' | 'lg'
}) {
    const sizeClass = size === 'lg' ? 'h-11 w-11' : 'h-7 w-7'

    return (
        <span className={`relative inline-flex shrink-0 ${sizeClass}`}>
            <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className={`${sizeClass} text-star-empty`}
                fill="currentColor"
            >
                <path d="M12 2.75l2.86 5.8 6.4.93-4.63 4.51 1.09 6.37L12 17.35l-5.72 3.01 1.09-6.37-4.63-4.51 6.4-.93L12 2.75z" />
            </svg>
            <span
                className="absolute inset-0 overflow-hidden text-star-filled"
                style={{ width: `${fillPercent}%` }}
            >
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className={sizeClass}
                    fill="currentColor"
                >
                    <path d="M12 2.75l2.86 5.8 6.4.93-4.63 4.51 1.09 6.37L12 17.35l-5.72 3.01 1.09-6.37-4.63-4.51 6.4-.93L12 2.75z" />
                </svg>
            </span>
        </span>
    )
}

export function TasteStars({
    score,
    size = 'md',
}: {
    score: number | null
    size?: 'sm' | 'md'
}) {
    const starValue = score === null ? 0 : score / 2
    const starSizeClass = size === 'sm' ? 'scale-75 -mx-1' : ''

    return (
        <span className="inline-flex items-center gap-0.5" aria-label={score === null ? 'No taste score' : `${starValue} out of 5 taste`}>
            {Array.from({ length: 5 }, (_, index) => {
                const fillPercent = Math.max(0, Math.min(1, starValue - index)) * 100

                return (
                    <span key={index} className={starSizeClass}>
                        <StarIcon fillPercent={fillPercent} />
                    </span>
                )
            })}
        </span>
    )
}

export function PreferenceInput({ 
    name = 'preference',
    defaultValue = '',
    className = '',
    padSize = 'md'
}: PreferenceInputProps) {
    const [score, setScore] = useState<number | null>(() => parseTasteScore(defaultValue))
    const labelClass = padSize === 'sm' ? 'text-xs' : 'text-sm'
    const isLarge = padSize === 'lg'
    const starSize = isLarge ? 'lg' : 'md'
    const halfStarButtonClass = isLarge ? 'h-11 w-5.5' : 'h-7 w-3.5'

    return (
        <div className={`${isLarge ? '' : 'rounded-lg border border-app-border bg-app-surface-raised/90 p-2'} ${className}`}>
            <input type="hidden" name={name} value={score ?? ''} />
            {!isLarge ? (
                <div className="mb-1 flex items-center justify-between gap-2">
                    <span className={`font-semibold text-app-text ${labelClass}`}>Taste</span>
                    <span className={`text-app-subtle ${labelClass}`}>
                        {score === null ? 'Not set' : formatTasteRating(score)}
                    </span>
                </div>
            ) : null}
            <div className={`flex items-center ${isLarge ? 'gap-1' : 'gap-0.5'}`} role="radiogroup" aria-label="Taste">
                {Array.from({ length: 5 }, (_, index) => {
                    const leftScore = index * 2 + 1
                    const rightScore = index * 2 + 2
                    const fillPercent = score === null
                        ? 0
                        : Math.max(0, Math.min(1, score / 2 - index)) * 100

                    return (
                        <span key={index} className="relative inline-flex">
                            <StarIcon fillPercent={fillPercent} size={starSize} />
                            <button
                                type="button"
                                role="radio"
                                aria-checked={score === leftScore}
                                aria-label={`${leftScore / 2} out of 5 taste`}
                                onClick={() => setScore(leftScore)}
                                className={`absolute left-0 top-0 rounded-l focus:outline-none focus:ring-2 focus:ring-primary ${halfStarButtonClass}`}
                            />
                            <button
                                type="button"
                                role="radio"
                                aria-checked={score === rightScore}
                                aria-label={`${rightScore / 2} out of 5 taste`}
                                onClick={() => setScore(rightScore)}
                                className={`absolute right-0 top-0 rounded-r focus:outline-none focus:ring-2 focus:ring-primary ${halfStarButtonClass}`}
                            />
                        </span>
                    )
                })}
                {score !== null && !isLarge ? (
                    <button
                        type="button"
                        onClick={() => setScore(null)}
                        className="ml-2 rounded-md px-2 py-1 text-xs font-semibold text-app-subtle hover:bg-app-surface-soft hover:text-app-text"
                    >
                        Clear
                    </button>
                ) : null}
            </div>
        </div>
    )
}
