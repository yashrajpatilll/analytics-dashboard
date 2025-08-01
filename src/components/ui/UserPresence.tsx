'use client';

import React from 'react';
import { useDashboardStore } from '@/stores/dashboardStore';
import { CollaborativeUser } from '@/types/analytics';

interface UserAvatarProps {
  user: CollaborativeUser;
  size?: 'sm' | 'md' | 'lg';
}

const UserAvatar: React.FC<UserAvatarProps> = ({ user, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  const isActive = Date.now() - new Date(user.lastActivity).getTime() < 30000; // Active in last 30 seconds
  
  return (
    <div className="relative">
      <div
        className={`
          ${sizeClasses[size]} rounded-full flex items-center justify-center
          font-medium text-white shadow-lg border-2 border-white
          ${isActive ? 'ring-2 ring-green-400' : 'ring-2 ring-gray-300'}
        `}
        style={{ backgroundColor: `hsl(${user.id.charCodeAt(0) * 137.508}deg, 70%, 50%)` }}
        title={`${user.name} - ${isActive ? 'Active' : 'Inactive'}`}
      >
        {user.avatar ? (
          <img 
            src={user.avatar} 
            alt={user.name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          user.name.charAt(0).toUpperCase()
        )}
      </div>
      
      {/* Online status indicator */}
      <div
        className={`
          absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white
          ${isActive ? 'bg-green-500' : 'bg-gray-400'}
        `}
      />
    </div>
  );
};

interface CollaborativeCursorProps {
  user: CollaborativeUser;
}

const CollaborativeCursor: React.FC<CollaborativeCursorProps> = ({ user }) => {
  if (!user.cursor) return null;

  const isRecent = Date.now() - new Date(user.lastActivity).getTime() < 5000; // Show cursor for 5 seconds
  
  if (!isRecent) return null;

  return (
    <div
      className="fixed pointer-events-none z-50 transition-all duration-100"
      style={{
        left: user.cursor.x,
        top: user.cursor.y,
        transform: 'translate(-2px, -2px)'
      }}
    >
      {/* Cursor icon */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        className="drop-shadow-lg"
      >
        <path
          d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
          fill={`hsl(${user.id.charCodeAt(0) * 137.508}deg, 70%, 50%)`}
          stroke="white"
          strokeWidth="1"
        />
      </svg>
      
      {/* User name label */}
      <div
        className="
          absolute top-5 left-2 px-2 py-1 text-xs font-medium text-white rounded
          shadow-lg max-w-20 truncate
        "
        style={{ backgroundColor: `hsl(${user.id.charCodeAt(0) * 137.508}deg, 70%, 40%)` }}
      >
        {user.name}
      </div>
    </div>
  );
};

export const UserPresence: React.FC = () => {
  const { collaborativeUsers, currentUser, isSharedSession } = useDashboardStore();

  if (!isSharedSession) return null;

  const otherUsers = collaborativeUsers.filter(user => user.id !== currentUser?.id);

  return (
    <>
      {/* User presence indicators in header */}
      <div className="flex items-center space-x-2">
        {currentUser && (
          <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full">
            <UserAvatar user={currentUser} size="sm" />
            <span className="text-sm text-blue-700 dark:text-blue-300">You</span>
          </div>
        )}
        
        {otherUsers.length > 0 && (
          <div className="flex items-center space-x-1">
            <div className="flex -space-x-2">
              {otherUsers.slice(0, 3).map(user => (
                <UserAvatar key={user.id} user={user} size="sm" />
              ))}
            </div>
            
            {otherUsers.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-300">
                +{otherUsers.length - 3}
              </div>
            )}
            
            <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
              {otherUsers.length} other{otherUsers.length !== 1 ? 's' : ''} online
            </span>
          </div>
        )}
      </div>

      {/* Collaborative cursors */}
      {otherUsers.map(user => (
        <CollaborativeCursor key={user.id} user={user} />
      ))}
    </>
  );
};

interface UserListProps {
  maxVisible?: number;
}

export const UserList: React.FC<UserListProps> = ({ maxVisible = 5 }) => {
  const { collaborativeUsers, currentUser, isSharedSession } = useDashboardStore();

  if (!isSharedSession || collaborativeUsers.length === 0) return null;

  const allUsers = currentUser ? [currentUser, ...collaborativeUsers.filter(u => u.id !== currentUser.id)] : collaborativeUsers;
  const visibleUsers = allUsers.slice(0, maxVisible);
  const hiddenCount = Math.max(0, allUsers.length - maxVisible);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
        Collaborative Session ({allUsers.length} user{allUsers.length !== 1 ? 's' : ''})
      </h3>
      
      <div className="space-y-2">
        {visibleUsers.map(user => {
          const isActive = Date.now() - new Date(user.lastActivity).getTime() < 30000;
          const isSelf = user.id === currentUser?.id;
          
          return (
            <div key={user.id} className="flex items-center space-x-3">
              <UserAvatar user={user} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {user.name} {isSelf && '(You)'}
                  </span>
                  <div
                    className={`
                      w-2 h-2 rounded-full
                      ${isActive ? 'bg-green-500' : 'bg-gray-400'}
                    `}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Joined {new Date(user.joinedAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          );
        })}
        
        {hiddenCount > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400 pl-9">
            +{hiddenCount} more user{hiddenCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};