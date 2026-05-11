'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { 
  Settings as SettingsIcon, ArrowLeft, ArrowRight, Save,
  Bell, Globe, Eye, Clock, Calendar, Moon, Sun, Mail, Users, Shield
} from 'lucide-react';

const SETTINGS_STORAGE_KEY = 'danesh.teacher.settings';

export default function TeacherSettings({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations();
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;

  const [settings, setSettings] = useState({
    // Notifications
    emailNotifications: true,
    assignmentSubmissions: true,
    studentQuestions: true,
    weeklyDigest: true,
    
    // Display
    theme: 'system' as 'light' | 'dark' | 'system',
    language: locale,
    
    // Schedule
    officeHours: '9:00-17:00',
    timezone: 'Asia/Tehran',
    
    // Privacy
    showEmail: false,
    showPhone: false,
  });

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ variant: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    try {
      const storedSettings = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!storedSettings) return;

      setSettings((prev) => ({
        ...prev,
        ...JSON.parse(storedSettings),
      }));
    } catch {
      setFeedback({
        variant: 'error',
        message: isRTL ? 'تنظیمات ذخیره‌شده قابل بارگذاری نبود.' : 'Saved settings could not be loaded.',
      });
    }
  }, [isRTL]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await new Promise(resolve => setTimeout(resolve, 600));
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      setFeedback({
        variant: 'success',
        message: isRTL ? 'تنظیمات با موفقیت ذخیره شد.' : 'Settings saved successfully.',
      });
    } catch {
      setFeedback({
        variant: 'error',
        message: isRTL ? 'ذخیره تنظیمات با خطا مواجه شد.' : 'Failed to save settings.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href={`/${locale}/teacher`}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Arrow className="h-5 w-5" />
              <span>{isRTL ? 'بازگشت' : 'Back'}</span>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">{isRTL ? 'تنظیمات' : 'Settings'}</h1>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? (isRTL ? 'در حال ذخیره...' : 'Saving...') : (isRTL ? 'ذخیره تغییرات' : 'Save Changes')}</span>
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {feedback ? <FeedbackBanner variant={feedback.variant} message={feedback.message} /> : null}

        {/* Notifications */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            {isRTL ? 'اعلان‌ها' : 'Notifications'}
          </h2>
          <div className="space-y-4">
            {[
              { key: 'emailNotifications', label: isRTL ? 'اعلان‌های ایمیل' : 'Email Notifications' },
              { key: 'assignmentSubmissions', label: isRTL ? 'ثبت تکالیف جدید' : 'New Assignment Submissions' },
              { key: 'studentQuestions', label: isRTL ? 'سوالات دانش‌آموزان' : 'Student Questions' },
              { key: 'weeklyDigest', label: isRTL ? 'خلاصه هفتگی' : 'Weekly Digest' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                <label className="font-medium cursor-pointer" htmlFor={item.key}>
                  {item.label}
                </label>
                <input
                  type="checkbox"
                  id={item.key}
                  checked={settings[item.key as keyof typeof settings] as boolean}
                  onChange={(e) => setSettings(prev => ({ ...prev, [item.key]: e.target.checked }))}
                  className="h-4 w-4 rounded"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Display */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            {isRTL ? 'نمایش' : 'Display'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{isRTL ? 'تم' : 'Theme'}</label>
              <select
                value={settings.theme}
                onChange={(e) => setSettings(prev => ({ ...prev, theme: e.target.value as any }))}
                className="w-full px-3 py-2 rounded-lg border bg-background"
              >
                <option value="light">{isRTL ? 'روشن' : 'Light'}</option>
                <option value="dark">{isRTL ? 'تیره' : 'Dark'}</option>
                <option value="system">{isRTL ? 'خودکار (مطابق سیستم)' : 'System'}</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{isRTL ? 'زبان' : 'Language'}</label>
              <select
                value={settings.language}
                onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border bg-background"
              >
                <option value="en">English</option>
                <option value="fa">فارسی</option>
              </select>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {isRTL ? 'برنامه زمانی' : 'Schedule'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{isRTL ? 'ساعات کاری' : 'Office Hours'}</label>
              <input
                type="text"
                value={settings.officeHours}
                onChange={(e) => setSettings(prev => ({ ...prev, officeHours: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border bg-background"
                placeholder="9:00-17:00"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{isRTL ? 'منطقه زمانی' : 'Timezone'}</label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border bg-background"
              >
                <option value="Asia/Tehran">Tehran (UTC+3:30)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">New York (UTC-5)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Privacy */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {isRTL ? 'حریم خصوصی' : 'Privacy'}
          </h2>
          <div className="space-y-4">
            {[
              { key: 'showEmail', label: isRTL ? 'نمایش ایمیل به دانش‌آموزان' : 'Show email to students' },
              { key: 'showPhone', label: isRTL ? 'نمایش شماره تلفن به دانش‌آموزان' : 'Show phone to students' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                <label className="font-medium cursor-pointer" htmlFor={item.key}>
                  {item.label}
                </label>
                <input
                  type="checkbox"
                  id={item.key}
                  checked={settings[item.key as keyof typeof settings] as boolean}
                  onChange={(e) => setSettings(prev => ({ ...prev, [item.key]: e.target.checked }))}
                  className="h-4 w-4 rounded"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
