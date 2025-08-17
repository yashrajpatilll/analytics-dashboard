'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { AuthForm } from '@/components/auth/AuthForm'
import { Logo } from '@/components/ui/Logo'
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
    <div className="min-h-screen bg-background lg:bg-gradient-to-br lg:from-background lg:to-muted/30 flex relative overflow-hidden">
      {/* Subtle animated background elements */}
      <div className="absolute inset-0 lg:block hidden">
        <div className="absolute top-1/4 left-10 w-2 h-2 bg-primary/20 rounded-full animate-pulse opacity-40"></div>
        <div className="absolute top-1/2 right-20 w-1.5 h-1.5 bg-primary/30 rounded-full animate-bounce opacity-30" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/3 left-1/4 w-2.5 h-2.5 bg-primary/15 rounded-full animate-ping opacity-25" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Left Side - Marketing Preview */}
      <div className="hidden lg:block lg:w-3/5 relative">
        {/* Subtle Pattern Background */}
        <div className="absolute inset-0 opacity-25">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/6 via-transparent to-primary/4"></div>
          <div 
            className="absolute inset-0" 
            style={{
              backgroundImage: 'radial-gradient(circle at 25% 25%, rgb(166, 124, 82) 1px, transparent 1px), radial-gradient(circle at 75% 75%, rgb(166, 124, 82) 0.5px, transparent 0.5px)',
              backgroundSize: '32px 32px, 16px 16px',
              opacity: 0.5
            }}
          ></div>
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/6 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute bottom-1/3 right-1/4 w-28 h-28 bg-primary/4 rounded-full blur-2xl animate-blob animation-delay-2000"></div>
          <div className="absolute top-2/3 left-1/3 w-20 h-20 bg-primary/5 rounded-full blur-xl animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="h-full flex items-center justify-center p-12 relative z-10">
          <div className="max-w-lg w-full space-y-8">
            {/* Hero section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Logo width={32} height={38} />
                <h1 className="text-4xl font-bold text-foreground leading-tight">
                  Analytics Dashboard
                </h1>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Real-time website performance monitoring and insights for your business.
              </p>
            </div>
            
            {/* Dashboard Preview */}
            <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-lg">
              {/* Site metrics preview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Active Sites</span>
                  <span className="text-sm text-primary font-medium">5 connected</span>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-background/50 rounded-lg p-3 text-center">
                    <div className="text-xs text-muted-foreground mb-1">E-commerce</div>
                    <div className="text-sm font-semibold text-foreground">1.2k</div>
                    <div className="text-xs text-green-600">+12%</div>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3 text-center border border-primary/20">
                    <div className="text-xs text-muted-foreground mb-1">Corporate</div>
                    <div className="text-sm font-semibold text-foreground">847</div>
                    <div className="text-xs text-green-600">+8%</div>
                  </div>
                  <div className="bg-background/50 rounded-lg p-3 text-center">
                    <div className="text-xs text-muted-foreground mb-1">Blog</div>
                    <div className="text-sm font-semibold text-foreground">432</div>
                    <div className="text-xs text-red-600">-3%</div>
                  </div>
                </div>
                
                {/* Realistic chart */}
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Weekly Traffic</div>
                  <div className="h-16 relative">
                    <svg className="w-full h-full" viewBox="0 0 280 50">
                      {/* Grid lines */}
                      <defs>
                        <pattern id="grid" width="40" height="10" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 10" fill="none" stroke="rgb(166, 124, 82)" strokeWidth="0.3" opacity="0.2"/>
                        </pattern>
                      </defs>
                      <rect width="280" height="50" fill="url(#grid)" />
                      
                      {/* Main trend line */}
                      <path 
                        d="M 20 35 L 60 28 L 100 32 L 140 22 L 180 18 L 220 25 L 260 15" 
                        stroke="rgb(166, 124, 82)" 
                        strokeWidth="2" 
                        fill="none" 
                        className="animate-dash"
                      />
                      
                      {/* Data points */}
                      <circle cx="20" cy="35" r="2" fill="rgb(166, 124, 82)" opacity="0.8"/>
                      <circle cx="100" cy="32" r="2" fill="rgb(166, 124, 82)" opacity="0.8"/>
                      <circle cx="180" cy="18" r="2" fill="rgb(166, 124, 82)" opacity="0.8"/>
                      <circle cx="260" cy="15" r="2" fill="rgb(166, 124, 82)" opacity="0.8"/>
                    </svg>
                  </div>
                  
                  {/* Chart labels */}
                  <div className="flex justify-between text-xs text-muted-foreground px-2">
                    <span>Mon</span>
                    <span>Wed</span>
                    <span>Fri</span>
                    <span>Sun</span>
                  </div>
                </div>
                
                {/* Live indicator */}
                <div className="flex items-center space-x-2 pt-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-muted-foreground">Live data • Last updated 2 min ago</span>
                </div>
              </div>
            </div>
            
            {/* Feature list */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                </div>
                <span className="text-sm text-muted-foreground">Real-time visitor tracking</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                </div>
                <span className="text-sm text-muted-foreground">Performance insights & alerts</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                </div>
                <span className="text-sm text-muted-foreground">Multi-site dashboard</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form (Primary Focus) */}
      <div className="w-full lg:w-2/5 lg:min-h-screen lg:bg-background/95 lg:backdrop-blur-sm lg:border-l lg:border-border/50 flex items-center justify-center p-6 lg:p-8">
        <div className="w-full max-w-sm space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Logo width={40} height={48} />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Welcome back
              </h1>
              <p className="text-muted-foreground text-sm">
                Sign in to your analytics dashboard
              </p>
            </div>
          </div>
          
          {/* Auth Form */}
          <div className="space-y-6">
            <AuthForm onSuccess={() => {
              const targetUrl = redirectUrl || '/'
              console.log('Auth success, redirecting to:', targetUrl)
              router.replace(targetUrl)
            }} />
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              By signing in, you agree to our{' '}
              <a href="#" className="text-primary hover:underline">
                Terms
              </a>{' '}
              and{' '}
              <a href="#" className="text-primary hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
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