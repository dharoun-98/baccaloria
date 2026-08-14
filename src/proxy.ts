import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/** Routes that require a signed-in user. */
const PROTECTED_PREFIXES = [
  '/accueil',
  '/matieres',
  '/quiz',
  '/tests',
  '/examens',
  '/profil',
  '/classement',
  '/admin',
]

/** Routes a signed-in user should be bounced away from. */
const AUTH_ROUTES = ['/connexion', '/inscription']

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  // getUser() revalidates the JWT against Supabase. Do NOT swap this for
  // getSession(), which trusts a cookie the client could have forged.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (!user && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone()
    url.pathname = '/connexion'
    url.searchParams.set('suivant', pathname)
    return NextResponse.redirect(url)
  }

  if (user && AUTH_ROUTES.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone()
    url.pathname = '/accueil'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // The admin area is additionally gated by role. RLS is the real enforcement;
  // this just avoids rendering an admin shell the user cannot populate.
  if (user && pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'editor', 'teacher'].includes(profile.role)) {
      const url = request.nextUrl.clone()
      url.pathname = '/accueil'
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Everything except static assets, the service worker and image files.
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|woff2?)$).*)',
  ],
}
