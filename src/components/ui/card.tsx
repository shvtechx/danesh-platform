import * as React from 'react';
import { cn } from '@/lib/utils';

// Card Component
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    hover?: boolean;
    interactive?: boolean;
  }
>(({ className, hover = false, interactive = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-200',
      hover && 'hover:shadow-md hover:border-primary/20',
      interactive && 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]',
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

// Card Header
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

// Card Title
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-xl font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

// Card Description
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

// Card Content
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

// Card Footer
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

// Course Card (Specialized)
interface CourseCardProps {
  title: string;
  description: string;
  image?: string;
  progress?: number;
  grade?: 'early-years' | 'primary' | 'middle' | 'secondary';
  curriculum?: string;
  xp?: number;
  lessonsCount?: number;
  onClick?: () => void;
  className?: string;
}

const CourseCard = ({
  title,
  description,
  image,
  progress = 0,
  grade = 'primary',
  curriculum,
  xp,
  lessonsCount,
  onClick,
  className,
}: CourseCardProps) => {
  const gradeColors = {
    'early-years': 'from-pink-500 to-orange-400',
    primary: 'from-blue-500 to-cyan-400',
    middle: 'from-purple-500 to-pink-500',
    secondary: 'from-green-500 to-teal-400',
  };

  return (
    <Card
      interactive
      className={cn('overflow-hidden', className)}
      onClick={onClick}
    >
      {/* Image/Header */}
      <div className={cn(
        'relative h-32 bg-gradient-to-br',
        gradeColors[grade]
      )}>
        {image ? (
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-4xl opacity-50">📚</span>
          </div>
        )}
        
        {/* Progress Overlay */}
        {progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
            <div
              className="h-full bg-white"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        
        {/* Curriculum Badge */}
        {curriculum && (
          <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium">
            {curriculum}
          </span>
        )}
      </div>

      <CardContent className="p-4">
        <CardTitle className="text-base line-clamp-1">{title}</CardTitle>
        <CardDescription className="mt-1 line-clamp-2">
          {description}
        </CardDescription>
        
        {/* Meta Info */}
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          {lessonsCount && (
            <span className="flex items-center gap-1">
              📖 {lessonsCount} lessons
            </span>
          )}
          {xp && (
            <span className="flex items-center gap-1 text-amber-600">
              ⭐ {xp} XP
            </span>
          )}
          {progress > 0 && (
            <span className="ml-auto font-medium text-primary">
              {progress}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Achievement Card
interface AchievementCardProps {
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  earned?: boolean;
  earnedAt?: Date;
  className?: string;
}

const AchievementCard = ({
  title,
  description,
  icon,
  rarity,
  earned = false,
  className,
}: AchievementCardProps) => {
  const rarityStyles = {
    common: 'from-gray-400 to-gray-500',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-amber-400 to-orange-500',
    mythic: 'from-pink-400 via-purple-500 to-indigo-500',
  };

  return (
    <Card
      className={cn(
        'text-center',
        !earned && 'opacity-50 grayscale',
        className
      )}
    >
      <CardContent className="p-4">
        <div
          className={cn(
            'mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br text-3xl',
            rarityStyles[rarity]
          )}
        >
          {icon}
        </div>
        <h4 className="font-semibold">{title}</h4>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        <span
          className={cn(
            'mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize',
            rarity === 'common' && 'bg-gray-100 text-gray-700',
            rarity === 'rare' && 'bg-blue-100 text-blue-700',
            rarity === 'epic' && 'bg-purple-100 text-purple-700',
            rarity === 'legendary' && 'bg-amber-100 text-amber-700',
            rarity === 'mythic' && 'bg-gradient-to-r from-pink-100 to-indigo-100 text-purple-700'
          )}
        >
          {rarity}
        </span>
      </CardContent>
    </Card>
  );
};

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  CourseCard,
  AchievementCard,
};
