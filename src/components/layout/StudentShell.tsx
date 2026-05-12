'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Home,
  BookOpen,
  GraduationCap,
  Trophy,
  BrainCircuit,
  Users,
  Heart,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  ChevronDown,
  BarChart,
  FileText,
  User,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import { ImpersonationBanner } from '@/components/auth/ImpersonationBanner';
import { AUTH_STORAGE_KEY, clearAuthSession, getHomeRouteForRoles, getPrimaryRole } from '@/lib/auth/demo-auth-shared';

interface StudentShellProps {
  children: React.ReactNode;
  locale: string;
}

export function StudentShell({ children, locale }: StudentShellProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const isRTL = locale === 'fa';
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [authUser, setAuthUser] = useState<{
    id: string;
    email: string;
    profile?: { displayName?: string; firstName?: string; lastName?: string };
    roles?: string[];
  } | null>(null);

  useEffect(() => {
    setHasMounted(true);

    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        setAuthUser(JSON.parse(raw));
      }
    } catch {
      setAuthUser(null);
    }
  }, []);

  useEffect(() => {
    if (!authUser) {
      return;
    }

    const primaryRole = getPrimaryRole(authUser.roles || []);
    if (primaryRole !== 'STUDENT') {
      router.replace(getHomeRouteForRoles(locale, authUser.roles || []));
    }
  }, [authUser, locale, router]);

  const user = useMemo(
    () => ({
      name:
        authUser?.profile?.displayName ||
        [authUser?.profile?.firstName, authUser?.profile?.lastName].filter(Boolean).join(' ') ||
        (isRTL ? 'دانش‌آموز' : 'Student'),
      email: authUser?.email || 'student@danesh.app',
      level: 12,
      currentXP: 2450,
      nextLevelXP: 3000,
      streak: 7,
    }),
    [authUser, isRTL],
  );

  const navigation = [
    { name: t('navigation.dashboard'), href: `/${locale}/dashboard`, icon: Home },
    { name: t('navigation.courses'), href: `/${locale}/courses`, icon: BookOpen },
    { name: t('navigation.practice'), href: `/${locale}/student/skills`, icon: BrainCircuit },
    { name: t('navigation.assessments'), href: `/${locale}/assessments`, icon: GraduationCap },
    { name: t('navigation.marksheet'), href: `/${locale}/student/marksheet`, icon: FileText },
    { name: t('navigation.achievements'), href: `/${locale}/achievements`, icon: Trophy },
    { name: t('navigation.leaderboard'), href: `/${locale}/leaderboard`, icon: BarChart },
    { name: t('navigation.forum'), href: `/${locale}/forum`, icon: Users },
    { name: t('navigation.wellbeing'), href: `/${locale}/wellbeing`, icon: Heart },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');
  const xpProgress = Math.round((user.currentXP / user.nextLevelXP) * 100);

  const handleLogout = () => {
    clearAuthSession();
    router.push(`/${locale}/login`);
    router.refresh();
  };

  const notifications = [
    {
      id: 'n1',
      title: isRTL ? 'تکلیف جدید اضافه شد' : 'New assignment added',
      time: isRTL ? '۱۰ دقیقه پیش' : '10 min ago',
    },
    {
      id: 'n2',
      title: isRTL ? '۱۰ امتیاز برای حضور روزانه دریافت کردید' : 'You earned 10 XP for daily check-in',
      time: isRTL ? '۱ ساعت پیش' : '1 hour ago',
    },
    {
      id: 'n3',
      title: isRTL ? 'پاسخ جدید در انجمن' : 'New reply in forum',
      time: isRTL ? 'دیروز' : 'Yesterday',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen ? <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} /> : null}

      <aside
        className={`fixed inset-y-0 z-50 flex w-[min(20rem,88vw)] max-w-sm flex-col border-e bg-card transition-transform duration-300 lg:w-72 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full'
        } ${isRTL ? 'right-0 border-l' : 'left-0 border-r'}`}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-lg font-bold text-primary sm:text-xl">{t('common.appName')}</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-2 hover:bg-muted lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b p-4">
          <div className="mb-4 overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-3.5 sm:p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-lg font-semibold text-primary">
                  {user.name.charAt(0)}
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {user.level}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold">{user.name}</h3>
                <p className="text-sm text-muted-foreground">
                  🔥 {user.streak} {isRTL ? 'روز پیاپی' : 'day streak'}
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t('gamification.level')} {user.level}
                </span>
                <span className="font-medium">
                  {user.currentXP} / {user.nextLevelXP} XP
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted/80">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${xpProgress}%` }} />
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1.5">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-colors ${
                      active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="space-y-2 border-t p-4">
          <Link
            href={`/${locale}/settings`}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Settings className="h-5 w-5" />
            <span>{t('navigation.settings')}</span>
          </Link>
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {hasMounted ? (
              <>
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                <span>{isDark ? t('common.lightMode') : t('common.darkMode')}</span>
              </>
            ) : (
              <>
                <Moon className="h-5 w-5" />
                <span>{t('common.darkMode')}</span>
              </>
            )}
          </button>
        </div>
      </aside>

      <div className={`${isRTL ? 'lg:mr-72' : 'lg:ml-72'}`}>
        <header className="sticky top-0 z-[70] flex h-16 items-center justify-between gap-2 border-b bg-background/80 px-3 backdrop-blur-lg sm:px-4 lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 hover:bg-muted lg:hidden">
            <Menu className="h-6 w-6" />
          </button>

          <div className="hidden max-w-md flex-1 lg:flex">
            <input
              type="search"
              placeholder={isRTL ? 'جستجو...' : 'Search...'}
              className="h-10 w-full rounded-xl border border-input bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link href={isRTL ? pathname.replace('/fa', '/en') : pathname.replace('/en', '/fa')} className="rounded-lg p-2 text-sm font-medium hover:bg-muted">
              {isRTL ? 'EN' : 'فا'}
            </Link>

            <div className="relative">
              <button
                onClick={() => {
                  setNotificationsOpen((prev) => !prev);
                  setUserMenuOpen(false);
                }}
                className="relative rounded-lg p-2 hover:bg-muted"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
              </button>

              {notificationsOpen ? (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                  <div className={`absolute top-full z-[80] mt-2 w-[calc(100vw-1.5rem)] max-w-80 rounded-2xl border bg-card shadow-lg ${isRTL ? 'left-0' : 'right-0'}`}>
                    <div className="border-b p-3">
                      <p className="font-semibold">{isRTL ? 'اعلان‌ها' : 'Notifications'}</p>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((item) => (
                        <button
                          key={item.id}
                          className="w-full border-b px-3 py-3 text-start transition-colors last:border-0 hover:bg-muted"
                          onClick={() => setNotificationsOpen(false)}
                        >
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{item.time}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            <div className="relative">
              <button onClick={() => setUserMenuOpen((prev) => !prev)} className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-muted">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
                  {user.name.charAt(0)}
                </div>
                <ChevronDown className="hidden h-4 w-4 sm:block" />
              </button>

              {userMenuOpen ? (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className={`absolute top-full z-[80] mt-2 w-56 max-w-[calc(100vw-1.5rem)] rounded-2xl border bg-card shadow-lg ${isRTL ? 'left-0' : 'right-0'}`}>
                    <div className="border-b p-3">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="p-1">
                      <Link
                        href={`/${locale}/profile`}
                        className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        {t('navigation.profile')}
                      </Link>
                      <Link
                        href={`/${locale}/settings`}
                        className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        {t('navigation.settings')}
                      </Link>
                      <hr className="my-1" />
                      <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-destructive hover:bg-muted" onClick={handleLogout}>
                        <LogOut className="h-4 w-4" />
                        {t('auth.logout')}
                      </button>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-5 lg:p-6">
          <ImpersonationBanner locale={locale} />
          {children}
        </main>
      </div>
    </div>
  );
}
