import { getSignInUrl } from '@workos-inc/authkit-nextjs'
import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'

function getSafeReturnPathname(value: string | null): string | undefined {
    if (!value || !value.startsWith('/') || value.startsWith('//')) {
        return undefined
    }

    return value
}

export async function GET(request: NextRequest) {
    const returnTo = getSafeReturnPathname(request.nextUrl.searchParams.get('returnPathname'))
    const signInUrl = await getSignInUrl({ returnTo })
    redirect(signInUrl)
}
