// File: proxy.ts (in the root directory of your project, e.g., leadflow-ai/proxy.ts)

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// The function must be named 'proxy' (a named export) or 'export default'.
// We'll use the named export `proxy` as it's the standard for Next.js 16.
export async function proxy(request: NextRequest) {
  // Let's keep the variable `let` for clarity, even though it's not reassigned.
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // This will refresh the session if needed.
  await supabase.auth.getUser()

  return response
}

// This `config` object is optional and remains unchanged from your middleware.
export const config = {
  matcher: ['/dashboard/:path*'],
}