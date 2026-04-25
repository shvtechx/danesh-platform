'use client';

import Link from 'next/link';
import { Home, ArrowLeft, ArrowRight } from 'lucide-react';

interface PageHeaderProps {
  locale: string;
  title: string;
  backHref?: string;
  backLabel?: string;
  showHome?: boolean;
  children?: React.ReactNode;
}

export function PageHeader({ 
  locale, 
  title, 
  backHref, 
  backLabel,
  showHome = true,
  children 
}: PageHeaderProps) {
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {backHref && (
            <>
              <Link 
                href={backHref}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Arrow className="h-5 w-5" />
                <span className="hidden sm:inline">{backLabel || (isRTL ? 'برگشت' : 'Back')}</span>
              </Link>
              <div className="h-6 w-px bg-border" />
            </>
          )}
          <h1 className="font-semibold text-lg">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {children}
          {showHome && (
            <Link
              href={`/${locale}`}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title={isRTL ? 'صفحه اصلی' : 'Home'}
            >
              <Home className="h-5 w-5" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
