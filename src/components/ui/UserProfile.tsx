'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from './Button';
import { User, LogOut } from 'lucide-react';

export const UserProfile: React.FC = () => {
  const { user, userProfile, signOut, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (loading) {
    return (
      <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
    );
  }

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
  };

  // Get display name from user or userProfile
  const displayName = userProfile?.full_name || user.email?.split('@')[0] || 'User';
  const email = user.email || userProfile?.email || '';
  const role = userProfile?.role || 'User';

  // Get user initials
  const getInitials = (name: string, email: string) => {
    if (name && name.trim()) {
      return name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  const initials = getInitials(displayName, email);

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}

        variant="outline"
        size="icon"
        className="w-8 h-8 rounded-full"
        title={`${displayName} - Click for profile menu`}
      >
        <span className="text-sm font-semibold text-primary">
          {initials}
        </span>
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Profile dropdown */}
          <div className="absolute right-0 top-full mt-2 w-64 bg-popover border border-border rounded-lg shadow-lg z-50">
            {/* User info section */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/15 rounded-full flex items-center justify-center ring-1 ring-primary/20">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-popover-foreground truncate">
                    {displayName}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {email}
                  </div>
                </div>
              </div>
            </div>

            {/* Role section */}
            <div className="p-3">
              <div className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-md">
                <span className="text-sm text-muted-foreground">Role</span>
                <span className="text-sm font-medium text-foreground bg-accent/50 px-2 py-1 rounded-sm">
                  {role}
                </span>
              </div>
            </div>

            {/* Sign out section */}
            <div className="p-3 border-t border-border">
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="w-full flex items-center gap-2 text-destructive border-destructive/20 hover:bg-destructive/5 hover:border-destructive/30 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};