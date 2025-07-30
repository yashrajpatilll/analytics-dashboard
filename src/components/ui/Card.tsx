import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-card text-card-foreground rounded-lg shadow-sm border border-border ${className}`}>
      {children}
    </div>
  );
};