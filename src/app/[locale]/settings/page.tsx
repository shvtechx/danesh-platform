'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  User, Bell, Palette, Globe, Eye, Lock, Moon, Sun, 
  Volume2, Monitor, Check, ChevronRight, Shield, Smartphone,
  Languages, Accessibility, Save
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';

export default function SettingsPage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const isRTL = locale === 'fa';
  const SETTINGS_KEY = 'danesh.settings.v1';

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sound: true,
  });

  const [accessibility, setAccessibility] = useState({
    fontSize: 'medium' as 'small' | 'medium' | 'large',
    reduceMotion: false,
    highContrast: false,
    focusMode: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const applyAccessibilitySettings = (next: typeof accessibility) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-font-size', next.fontSize);
    root.classList.toggle('reduce-motion', next.reduceMotion);
    root.classList.toggle('high-contrast', next.highContrast);
    root.classList.toggle('focus-mode', next.focusMode);
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) {
        applyAccessibilitySettings(accessibility);
        return;
      }

      const parsed = JSON.parse(raw) as {
        notifications?: typeof notifications;
        accessibility?: typeof accessibility;
      };

      if (parsed.notifications) {
        setNotifications(parsed.notifications);
      }
      if (parsed.accessibility) {
        setAccessibility(parsed.accessibility);
        applyAccessibilitySettings(parsed.accessibility);
      } else {
        applyAccessibilitySettings(accessibility);
      }
    } catch {
      applyAccessibilitySettings(accessibility);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyAccessibilitySettings(accessibility);
  }, [accessibility]);

  const handleLanguageChange = (newLocale: string) => {
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({
          notifications,
          accessibility,
        })
      );
      setSaveMessage(isRTL ? 'تنظیمات با موفقیت ذخیره شد.' : 'Settings saved successfully.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        notifications?: typeof notifications;
        accessibility?: typeof accessibility;
      };
      if (parsed.notifications) setNotifications(parsed.notifications);
      if (parsed.accessibility) {
        setAccessibility(parsed.accessibility);
        applyAccessibilitySettings(parsed.accessibility);
      }
      setSaveMessage(null);
    } catch {
      // ignore invalid stored settings
    }
  };

  const handleProfilePhotoEdit = () => {
    setSaveMessage(isRTL ? 'برای به‌روزرسانی تصویر پروفایل، تغییرات را ذخیره کنید و سپس از پروفایل اصلی ادامه دهید.' : 'Save your changes first, then continue profile photo updates from your main profile flow.');
  };

  const handleSecurityAction = (action: 'password' | 'devices' | 'twoFactor') => {
    const messages = {
      password: isRTL ? 'برای تغییر رمز عبور، پس از ذخیره تنظیمات به بخش امنیت حساب هدایت شوید.' : 'Save settings first, then continue from the account security flow to change your password.',
      devices: isRTL ? 'فهرست دستگاه‌های فعال از نشست‌های امن حساب شما بارگذاری می‌شود.' : 'Connected devices are loaded from your secure account sessions.',
      twoFactor: isRTL ? 'فعال‌سازی احراز هویت دومرحله‌ای از مسیر امنیت حساب انجام می‌شود.' : 'Two-factor authentication is managed from the secure account settings flow.',
    };

    setSaveMessage(messages[action]);
  };

  const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative h-6 w-11 rounded-full transition-colors ${
        enabled ? 'bg-primary' : 'bg-muted'
      }`}
    >
      <span 
        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
          enabled ? (isRTL ? 'left-1' : 'right-1') : (isRTL ? 'right-1' : 'left-1')
        }`} 
      />
    </button>
  );

  const themes = [
    { id: 'light', icon: Sun, label: isRTL ? 'روشن' : 'Light' },
    { id: 'dark', icon: Moon, label: isRTL ? 'تاریک' : 'Dark' },
    { id: 'system', icon: Monitor, label: isRTL ? 'سیستم' : 'System' },
  ];
  const activeTheme = isMounted ? theme : null;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        locale={locale}
        title={t('profile.settings')}
        backHref={`/${locale}/dashboard`}
        backLabel={isRTL ? 'داشبورد' : 'Dashboard'}
      />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <p className="text-muted-foreground mb-8">
          {isRTL ? 'تنظیمات حساب کاربری خود را مدیریت کنید' : 'Manage your account settings'}
        </p>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Sidebar Navigation - Desktop */}
          <nav className="hidden lg:block space-y-2">
            <div className="sticky top-20 space-y-1">
              {[
                { icon: User, label: isRTL ? 'پروفایل' : 'Profile', href: '#profile' },
                { icon: Palette, label: isRTL ? 'ظاهر' : 'Appearance', href: '#appearance' },
                { icon: Bell, label: isRTL ? 'اعلان‌ها' : 'Notifications', href: '#notifications' },
                { icon: Accessibility, label: isRTL ? 'دسترسی‌پذیری' : 'Accessibility', href: '#accessibility' },
                { icon: Shield, label: isRTL ? 'امنیت' : 'Security', href: '#security' },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors group"
                >
                  <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                  <span>{item.label}</span>
                </a>
              ))}
            </div>
          </nav>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Section */}
            <section id="profile" className="rounded-2xl border bg-card p-4 sm:p-6">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
                <User className="h-5 w-5 text-primary" />
                {t('profile.editProfile')}
              </h2>
              
              <div className="flex flex-col sm:flex-row gap-6 mb-6">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-3xl text-white font-bold">
                      {isRTL ? 'ع' : 'A'}
                    </div>
                    <button type="button" onClick={handleProfilePhotoEdit} className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-white hover:bg-primary/90">
                      <User className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium mb-2">{isRTL ? 'نام' : 'First Name'}</label>
                      <input
                        type="text"
                        className="w-full rounded-lg border border-input bg-background px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                        defaultValue={isRTL ? 'علی' : 'Ali'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">{isRTL ? 'نام خانوادگی' : 'Last Name'}</label>
                      <input
                        type="text"
                        className="w-full rounded-lg border border-input bg-background px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                        defaultValue={isRTL ? 'احمدی' : 'Ahmadi'}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('auth.email')}</label>
                    <input
                      type="email"
                      className="w-full rounded-lg border border-input bg-background px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      defaultValue="ali@example.com"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Appearance Section */}
            <section id="appearance" className="rounded-2xl border bg-card p-4 sm:p-6">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
                <Palette className="h-5 w-5 text-primary" />
                {isRTL ? 'زبان و ظاهر' : 'Language & Appearance'}
              </h2>
              
              <div className="space-y-6">
                {/* Language */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Languages className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium">{t('profile.language')}</p>
                      <p className="text-sm text-muted-foreground">{isRTL ? 'زبان نمایش' : 'Display language'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLanguageChange('fa')}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        locale === 'fa' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
                      }`}
                    >
                      🇮🇷 فارسی
                    </button>
                    <button
                      onClick={() => handleLanguageChange('en')}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        locale === 'en' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
                      }`}
                    >
                      🇺🇸 English
                    </button>
                  </div>
                </div>

                {/* Theme */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Moon className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="font-medium">{t('profile.theme')}</p>
                      <p className="text-sm text-muted-foreground">{isRTL ? 'تم برنامه' : 'App theme'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {themes.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                          activeTheme === t.id ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
                        }`}
                      >
                        <t.icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Notifications Section */}
            <section id="notifications" className="rounded-2xl border bg-card p-4 sm:p-6">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
                <Bell className="h-5 w-5 text-primary" />
                {t('profile.notifications')}
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3">
                  <div className="flex-1">
                    <p className="font-medium">{isRTL ? 'اعلان‌های ایمیل' : 'Email notifications'}</p>
                    <p className="text-sm text-muted-foreground">{isRTL ? 'دریافت ایمیل برای فعالیت‌ها' : 'Receive emails for activities'}</p>
                  </div>
                  <Toggle 
                    enabled={notifications.email} 
                    onChange={() => setNotifications(n => ({ ...n, email: !n.email }))} 
                  />
                </div>
                <div className="flex items-center justify-between py-3 border-t">
                  <div className="flex-1">
                    <p className="font-medium">{isRTL ? 'اعلان‌های پوش' : 'Push notifications'}</p>
                    <p className="text-sm text-muted-foreground">{isRTL ? 'اعلان‌های دسکتاپ' : 'Desktop notifications'}</p>
                  </div>
                  <Toggle 
                    enabled={notifications.push} 
                    onChange={() => setNotifications(n => ({ ...n, push: !n.push }))} 
                  />
                </div>
                <div className="flex items-center justify-between py-3 border-t">
                  <div className="flex items-center gap-3 flex-1">
                    <Volume2 className="h-5 w-5 text-muted-foreground" />
                    <p className="font-medium">{isRTL ? 'صدای اعلان' : 'Notification sound'}</p>
                  </div>
                  <Toggle 
                    enabled={notifications.sound} 
                    onChange={() => setNotifications(n => ({ ...n, sound: !n.sound }))} 
                  />
                </div>
              </div>
            </section>

            {/* Accessibility Section */}
            <section id="accessibility" className="rounded-2xl border bg-card p-4 sm:p-6">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
                <Eye className="h-5 w-5 text-primary" />
                {t('profile.accessibility')}
              </h2>
              
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3">
                  <p className="font-medium">{t('profile.fontSize')}</p>
                  <div className="flex gap-2">
                    {(['small', 'medium', 'large'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => setAccessibility(a => ({ ...a, fontSize: size }))}
                        className={`px-4 py-2 rounded-lg border transition-colors ${
                          accessibility.fontSize === size 
                            ? 'bg-primary text-primary-foreground border-primary' 
                            : 'hover:bg-muted'
                        }`}
                      >
                        {size === 'small' ? (isRTL ? 'کوچک' : 'Small') : 
                         size === 'medium' ? (isRTL ? 'متوسط' : 'Medium') : 
                         (isRTL ? 'بزرگ' : 'Large')}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between py-3 border-t">
                  <div className="flex-1">
                    <p className="font-medium">{t('profile.reduceMotion')}</p>
                    <p className="text-sm text-muted-foreground">{isRTL ? 'کاهش انیمیشن‌ها' : 'Reduce animations'}</p>
                  </div>
                  <Toggle 
                    enabled={accessibility.reduceMotion} 
                    onChange={() => setAccessibility(a => ({ ...a, reduceMotion: !a.reduceMotion }))} 
                  />
                </div>
                <div className="flex items-center justify-between py-3 border-t">
                  <p className="font-medium flex-1">{t('profile.highContrast')}</p>
                  <Toggle 
                    enabled={accessibility.highContrast} 
                    onChange={() => setAccessibility(a => ({ ...a, highContrast: !a.highContrast }))} 
                  />
                </div>
                <div className="flex items-center justify-between py-3 border-t">
                  <div className="flex-1">
                    <p className="font-medium">{t('profile.focusMode')}</p>
                    <p className="text-sm text-muted-foreground">{isRTL ? 'حذف حواس‌پرتی‌ها' : 'Remove distractions'}</p>
                  </div>
                  <Toggle 
                    enabled={accessibility.focusMode} 
                    onChange={() => setAccessibility(a => ({ ...a, focusMode: !a.focusMode }))} 
                  />
                </div>
              </div>
            </section>

            {/* Security Section */}
            <section id="security" className="rounded-2xl border bg-card p-4 sm:p-6">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
                <Lock className="h-5 w-5 text-primary" />
                {isRTL ? 'امنیت' : 'Security'}
              </h2>
              
              <div className="space-y-3">
                <button type="button" onClick={() => handleSecurityAction('password')} className="w-full flex items-center justify-between rounded-xl border p-4 hover:bg-muted transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                      <Lock className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="text-start">
                      <p className="font-medium">{isRTL ? 'تغییر رمز عبور' : 'Change password'}</p>
                      <p className="text-sm text-muted-foreground">{isRTL ? 'رمز عبور جدید تنظیم کنید' : 'Set a new password'}</p>
                    </div>
                  </div>
                  <ChevronRight className={`h-5 w-5 text-muted-foreground group-hover:text-foreground ${isRTL ? 'rotate-180' : ''}`} />
                </button>
                <button type="button" onClick={() => handleSecurityAction('devices')} className="w-full flex items-center justify-between rounded-xl border p-4 hover:bg-muted transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <Smartphone className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="text-start">
                      <p className="font-medium">{isRTL ? 'دستگاه‌های متصل' : 'Connected devices'}</p>
                      <p className="text-sm text-muted-foreground">{isRTL ? 'مدیریت دستگاه‌ها' : 'Manage devices'}</p>
                    </div>
                  </div>
                  <ChevronRight className={`h-5 w-5 text-muted-foreground group-hover:text-foreground ${isRTL ? 'rotate-180' : ''}`} />
                </button>
                <button type="button" onClick={() => handleSecurityAction('twoFactor')} className="w-full flex items-center justify-between rounded-xl border p-4 hover:bg-muted transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Shield className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="text-start">
                      <p className="font-medium">{isRTL ? 'احراز هویت دو مرحله‌ای' : 'Two-factor authentication'}</p>
                      <p className="text-sm text-muted-foreground">{isRTL ? 'امنیت بیشتر' : 'Extra security'}</p>
                    </div>
                  </div>
                  <ChevronRight className={`h-5 w-5 text-muted-foreground group-hover:text-foreground ${isRTL ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </section>

            {/* Save Button */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <button
                onClick={handleCancel}
                className="w-full sm:w-auto rounded-lg border px-6 py-2.5 hover:bg-muted transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {t('common.save')}
              </button>
            </div>
            {saveMessage && (
              <p className="text-sm text-green-600 text-end">{saveMessage}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
