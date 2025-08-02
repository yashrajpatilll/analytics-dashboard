import { createServerSupabaseClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    try {
      const supabase = await createServerSupabaseClient()
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error exchanging code for session:', error)
        return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
      }
      
      if (data?.session) {
        console.log('Successfully exchanged code for session:', data.session.user.email)
        
        // Redirect to dashboard with a refresh parameter to force auth state update
        const response = NextResponse.redirect(`${origin}/?refresh=true`)
        response.headers.set('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate')
        response.headers.set('Pragma', 'no-cache')
        return response
      }
    } catch (error) {
      console.error('Unexpected error during auth callback:', error)
      return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
    }
  }

  // Redirect to login if no code provided
  return NextResponse.redirect(`${origin}/login?error=no_code`)
}