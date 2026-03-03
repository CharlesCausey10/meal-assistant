interface CookingAnimationProps {
    hoverOnly?: boolean
    className?: string
}

export function CookingAnimation({ hoverOnly = false, className = '' }: CookingAnimationProps) {
    return (
        <span
            className={`cooking-animation ${hoverOnly ? 'cooking-animation--hover' : ''} ${className}`.trim()}
            aria-hidden="true"
        >
            <span className="cook-pan">🍳</span>
            <span className="cook-steam steam-1">💨</span>
            <span className="cook-steam steam-2">✨</span>
        </span>
    )
}
