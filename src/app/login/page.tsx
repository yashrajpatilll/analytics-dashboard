'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { AuthForm } from '@/components/auth/AuthForm'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'

function LoginContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect')

  useEffect(() => {
    if (user && !loading) {
      const targetUrl = redirectUrl || '/'
      console.log('User logged in, redirecting to:', targetUrl)
      // Use replace instead of push to prevent infinite loops
      router.replace(targetUrl)
    }
  }, [user, loading, router, redirectUrl])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Sign in to access your real-time analytics
          </p>
        </div>
        
        {/* Auth Form */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <AuthForm onSuccess={() => {
            const targetUrl = redirectUrl || '/'
            console.log('Auth success, redirecting to:', targetUrl)
            // Use replace instead of push to prevent infinite loops
            router.replace(targetUrl)
          }} />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          By signing in, you agree to our{' '}
          <a href="#" className="text-primary hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-primary hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}