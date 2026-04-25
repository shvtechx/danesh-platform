'use client';

import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '@/lib/utils';

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
      className
    )}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full', className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium',
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

// User Avatar with Level Badge
interface UserAvatarProps {
  src?: string;
  name: string;
  level?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLevel?: boolean;
  online?: boolean;
  className?: string;
}

const UserAvatar = ({
  src,
  name,
  level,
  size = 'md',
  showLevel = true,
  online,
  className,
}: UserAvatarProps) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-14 w-14',
    xl: 'h-20 w-20',
  };

  const levelSizeClasses = {
    sm: 'h-4 w-4 text-[10px]',
    md: 'h-5 w-5 text-xs',
    lg: 'h-6 w-6 text-xs',
    xl: 'h-8 w-8 text-sm',
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={cn('relative inline-block', className)}>
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={src} alt={name} />
        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-white">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      
      {/* Level Badge */}
      {showLevel && level && (
        <div
          className={cn(
            'absolute -bottom-1 -right-1 flex items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-yellow-400 font-bold text-white ring-2 ring-background',
            levelSizeClasses[size]
          )}
        >
          {level}
        </div>
      )}
      
      {/* Online Indicator */}
      {online !== undefined && (
        <div
          className={cn(
            'absolute right-0 top-0 h-3 w-3 rounded-full ring-2 ring-background',
            online ? 'bg-green-500' : 'bg-gray-400'
          )}
        />
      )}
    </div>
  );
};

// Avatar Group for displaying multiple avatars
interface AvatarGroupProps {
  avatars: { src?: string; name: string }[];
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const AvatarGroup = ({
  avatars,
  max = 4,
  size = 'md',
  className,
}: AvatarGroupProps) => {
  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-sm',
  };

  const displayed = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className={cn('flex -space-x-2 rtl:space-x-reverse', className)}>
      {displayed.map((avatar, index) => (
        <Avatar
          key={index}
          className={cn(sizeClasses[size], 'ring-2 ring-background')}
        >
          <AvatarImage src={avatar.src} alt={avatar.name} />
          <AvatarFallback className="bg-muted text-muted-foreground">
            {avatar.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-muted ring-2 ring-background',
            sizeClasses[size]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
};

export { Avatar, AvatarImage, AvatarFallback, UserAvatar, AvatarGroup };
