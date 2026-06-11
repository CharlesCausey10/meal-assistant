import { handleAuth } from '@workos-inc/authkit-nextjs'
import { syncAuthenticatedUser } from '@/lib/auth'

export const GET = handleAuth({
    onSuccess: async ({ user, organizationId }) => {
        await syncAuthenticatedUser(user, organizationId)
    },
})
