'use client';

import { useEffect, useState } from 'react';
import { ArrowLeftRight, RotateCcw } from 'lucide-react';
import {
  ORIGINAL_USER_STORAGE_KEY,
  getHomeRouteForRoles,
  persistAuthSession,
} from '@/lib/auth/demo-auth-shared';

interface StoredUser {
  id: string;
  profile?: {
    displayName?: string;
  };
  roles?: string[];
}

export function ImpersonationBanner({ locale }: { locale: string }) {
  const [originalUser, setOriginalUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ORIGINAL_USER_STORAGE_KEY);
      setOriginalUser(raw ? JSON.parse(raw) : null);
    } catch {
      setOriginalUser(null);
    }
  }, []);

  if (!originalUser) {
    return null;
  }

  const handleReturn = () => {
    persistAuthSession(originalUser);
    localStorage.removeItem(ORIGINAL_USER_STORAGE_KEY);
    const targetRoute = getHomeRouteForRoles(locale, originalUser.roles || ['SUPER_ADMIN']);
    window.location.assign(targetRoute);
  };

  return (
    <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-amber-300/40 bg-amber-500/10 px-4 py-3 text-sm">
      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
        <ArrowLeftRight className="h-4 w-4" />
        <span>
          Viewing as another user. Original account: <strong>{originalUser.profile?.displayName || 'Super Administrator'}</strong>
        </span>
      </div>
      <button
        onClick={handleReturn}
        className="inline-flex items-center gap-2 rounded-lg border border-amber-400/50 px-3 py-1.5 hover:bg-amber-500/10"
      >
        <RotateCcw className="h-4 w-4" />
        Return
      </button>
    </div>
  );
}
