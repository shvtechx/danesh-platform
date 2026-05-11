'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Home,
  BookOpen,
  GraduationCap,
  Trophy,
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
  User,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import { ImpersonationBanner } from '@/components/auth/ImpersonationBanner';
import { AUTH_STORAGE_KEY, ORIGINAL_USER_STORAGE_KEY, USER_ID_STORAGE_KEY } from '@/lib/auth/demo-auth-shared';

interface DashboardLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

export default function DashboardLayout({ children, params: { locale } }: DashboardLayoutProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const isRTL = locale === 'fa';
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [authUser, setAuthUser] = useState<{
    id: string;
    email: string;
    profile?: { displayName?: string; firstName?: string; lastName?: string };
    roles?: string[];
  } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        setAuthUser(JSON.parse(raw));
      }
    } catch {
      setAuthUser(null);
    }
  }, []);

  const user = useMemo(
    () => ({
      name: authUser?.profile?.displayName || [authUser?.profile?.firstName, authUser?.profile?.lastName].filter(Boolean).join(' ') || (isRTL ? 'دانش‌آموز' : 'Student'),
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
    { name: t('navigation.assessments'), href: `/${locale}/assessments`, icon: GraduationCap },
    { name: t('navigation.achievements'), href: `/${locale}/achievements`, icon: Trophy },
    { name: t('navigation.leaderboard'), href: `/${locale}/leaderboard`, icon: BarChart },
    { name: t('navigation.forum'), href: `/${locale}/forum`, icon: Users },
    { name: t('navigation.wellbeing'), href: `/${locale}/wellbeing`, icon: Heart },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const xpProgress = Math.round((user.currentXP / user.nextLevelXP) * 100);
  const handleLogout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(USER_ID_STORAGE_KEY);
    localStorage.removeItem(ORIGINAL_USER_STORAGE_KEY);
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
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 z-50 flex w-72 flex-col bg-card border-e transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen
            ? 'translate-x-0'
            : isRTL ? 'translate-x-full' : '-translate-x-full'
        } ${isRTL ? 'right-0 border-l' : 'left-0 border-r'}`}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b">
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-primary">{t('common.appName')}</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-semibold text-primary">
                {user.name.charAt(0)}
              </div>
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center font-bold">
                {user.level}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{user.name}</h3>
              <p className="text-sm text-muted-foreground">
                🔥 {user.streak} {isRTL ? 'روز پیاپی' : 'day streak'}
              </p>
            </div>
          </div>
          {/* XP Progress */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('gamification.level')} {user.level}</span>
              <span className="font-medium">{user.currentXP} / {user.nextLevelXP} XP</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
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

        {/* Sidebar Footer */}
        <div className="p-4 border-t space-y-2">
          <Link
            href={`/${locale}/settings`}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
          >
            <Settings className="h-5 w-5" />
            <span>{t('navigation.settings')}</span>
          </Link>
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span>{isDark ? t('common.lightMode') : t('common.darkMode')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`${isRTL ? 'lg:mr-72' : 'lg:ml-72'}`}>
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-[70] flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-lg px-4 lg:px-6">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-muted"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Search (Desktop) */}
          <div className="hidden lg:flex flex-1 max-w-md">
            <input
              type="search"
              placeholder={isRTL ? 'جستجو...' : 'Search...'}
              className="w-full h-10 px-4 rounded-lg border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <Link
              href={isRTL ? pathname.replace('/fa', '/en') : pathname.replace('/en', '/fa')}
              className="p-2 rounded-lg hover:bg-muted text-sm font-medium"
            >
              {isRTL ? 'EN' : 'فا'}
            </Link>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotificationsOpen((prev) => !prev);
                  setUserMenuOpen(false);
                }}
                className="relative p-2 rounded-lg hover:bg-muted"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
              </button>

              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                  <div className={`absolute top-full mt-2 w-80 rounded-lg border bg-card shadow-lg z-[80] ${
                    isRTL ? 'left-0' : 'right-0'
                  }`}>
                    <div className="p-3 border-b">
                      <p className="font-semibold">{isRTL ? 'اعلان‌ها' : 'Notifications'}</p>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((item) => (
                        <button
                          key={item.id}
                          className="w-full px-3 py-3 text-start hover:bg-muted transition-colors border-b last:border-0"
                          onClick={() => setNotificationsOpen(false)}
                        >
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted"
              >
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
                  {user.name.charAt(0)}
                </div>
                <ChevronDown className="h-4 w-4 hidden sm:block" />
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className={`absolute top-full mt-2 w-56 rounded-lg border bg-card shadow-lg z-[80] ${
                    isRTL ? 'left-0' : 'right-0'
                  }`}>
                    <div className="p-3 border-b">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="p-1">
                      <Link
                        href={`/${locale}/profile`}
                        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        {t('navigation.profile')}
                      </Link>
                      <Link
                        href={`/${locale}/settings`}
                        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        {t('navigation.settings')}
                      </Link>
                      <hr className="my-1" />
                      <button
                        className="flex w-full items-center gap-2 px-3 py-2 rounded-md hover:bg-muted text-destructive"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4" />
                        {t('auth.logout')}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          <ImpersonationBanner locale={locale} />
          {children}
        </main>
      </div>
    </div>
  );
}
