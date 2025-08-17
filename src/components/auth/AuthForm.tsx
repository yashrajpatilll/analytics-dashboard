"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { Eye, EyeOff } from "lucide-react";

interface AuthFormProps {
  onSuccess?: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const supabase = createClient();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) throw error;
        
        if (data.user && !data.user.email_confirmed_at) {
          setMessage("Check your email for the confirmation link!");
        } else if (data.user && data.user.email_confirmed_at) {
          // User is already confirmed, redirect to dashboard
          onSuccess?.();
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Invalid email or password. If you signed up recently, please check your email to confirm your account first.');
          }
          throw error;
        }
        
        if (data.user) {
          onSuccess?.();
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // OAuth functionality will be enabled in future phase
  // const handleOAuthSignIn = async (provider: 'google' | 'github') => {
  //   setIsLoading(true)
  //   setError('')

  //   try {
  //     const { error } = await supabase.auth.signInWithOAuth({
  //       provider,
  //       options: {
  //         redirectTo: `${window.location.origin}/auth/callback`,
  //       },
  //     })

  //     if (error) throw error
  //   } catch (error) {
  //     setError(error instanceof Error ? error.message : 'An error occurred')
  //     setIsLoading(false)
  //   }
  // }

  const handleMagicLink = async () => {
    if (!email) {
      setError("Please enter your email address first");
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      setMessage("Check your email for the magic link!");
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail("demo@example.com");
    setPassword("12345678");
    setError("");
    setMessage("");
  };

  return (
    <div className="space-y-6">

      {/* Email Form */}
      <form onSubmit={handleEmailAuth} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-sm font-medium text-foreground"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full h-10 px-3 py-2 text-sm bg-card text-muted-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            required
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-medium text-foreground"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full h-10 px-3 py-2 pr-10 text-sm bg-card text-muted-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
            {error}
          </div>
        )}

        {message && (
          <div className="text-sm text-green-600 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3">
            {message}
          </div>
        )}

        <Button type="submit" disabled={isLoading} className="w-full h-10">
          {isLoading ? "Please wait..." : isSignUp ? "Sign up" : "Sign in"}
        </Button>
      </form>

      {/* Demo Fill Button */}
      <div className="space-y-3">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Quick Demo
            </span>
          </div>
        </div>
        
        <Button 
          type="button"
          variant="outline"
          onClick={handleDemoFill}
          disabled={isLoading}
          className="w-full h-10 text-sm"
        >
          Try Demo Account
        </Button>
      </div>

      {/* Magic Link */}
      <div className="text-center">
        <button
          type="button"
          onClick={handleMagicLink}
          disabled={isLoading}
          className="text-sm text-primary hover:underline"
        >
          Send magic link instead
        </button>
      </div>

      {/* Toggle Sign In/Up */}
      <div className="text-center text-sm pt-4">
        <span className="text-muted-foreground">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
        </span>
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-primary hover:underline font-medium"
        >
          {isSignUp ? "Sign in" : "Sign up"}
        </button>
      </div>
    </div>
  );
};
