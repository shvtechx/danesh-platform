'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { 
  ArrowLeft, ArrowRight, Settings, Save, Bell, Shield, Globe,
  Mail, Palette, Users, BookOpen, Database, Key, Lock, Eye, EyeOff,
  Check, X, Info, AlertTriangle
} from 'lucide-react';

export default function AdminSettingsPage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations();
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;
  const settingsStorageKey = 'danesh.admin.settings.v1';
  const certificateTemplateKey = 'danesh.admin.certificateTemplate.v1';

  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [settings, setSettings] = useState({
    // General
    siteName: isRTL ? 'دانش' : 'Danesh',
    siteDescription: isRTL ? 'پلتفرم آموزش آنلاین' : 'Online Learning Platform',
    defaultLanguage: locale,
    allowRegistration: true,
    maintenanceMode: false,
    
    // Notifications
    emailNotifications: true,
    pushNotifications: false,
    newTeacherNotify: true,
    newStudentNotify: true,
    courseCompletionNotify: true,
    
    // Security
    twoFactorAuth: false,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireStrongPassword: true,
    
    // Teachers
    autoApproveTeachers: false,
    maxStudentsPerTeacher: 50,
    maxCoursesPerTeacher: 10,
    
    // Courses
    allowDraftCourses: true,
    requireCourseApproval: true,
    maxLessonsPerCourse: 30,
  });

  const [certificateTemplate, setCertificateTemplate] = useState({
    brandName: isRTL ? 'پلتفرم آموزشی دانش' : 'Danesh Learning Platform',
    tagLine: isRTL ? 'یادگیری • رشد • پیشرفت' : 'Learn • Grow • Achieve',
    website: 'www.danesh.app',
    issuerName: isRTL ? 'دفتر آموزش دانش' : 'Danesh Academic Office',
    primaryColor: '#152E58',
    accentColor: '#B98631',
    backgroundColor: '#F8F9FC',
    showBorder: true,
    showHeaderBar: true,
    showSeal: true,
    showSignatureLine: true,
    showWebsiteFooter: true,
  });

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(settingsStorageKey);
      if (savedSettings) {
        setSettings((prev) => ({ ...prev, ...JSON.parse(savedSettings) }));
      }

      const savedTemplate = localStorage.getItem(certificateTemplateKey);
      if (savedTemplate) {
        setCertificateTemplate((prev) => ({ ...prev, ...JSON.parse(savedTemplate) }));
      }
    } catch {
      // ignore invalid local data
    }
  }, []);

  const tabs = [
    { id: 'general', label: isRTL ? 'عمومی' : 'General', icon: Globe },
    { id: 'notifications', label: isRTL ? 'اعلان‌ها' : 'Notifications', icon: Bell },
    { id: 'security', label: isRTL ? 'امنیت' : 'Security', icon: Shield },
    { id: 'teachers', label: isRTL ? 'معلمان' : 'Teachers', icon: Users },
    { id: 'courses', label: isRTL ? 'دروس' : 'Courses', icon: BookOpen },
    { id: 'certificate', label: isRTL ? 'گواهی‌نامه' : 'Certificate', icon: Palette },
  ];

  const handleChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaveSuccess(false);
  };

  const handleTemplateChange = (key: string, value: any) => {
    setCertificateTemplate((prev) => ({ ...prev, [key]: value }));
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
    localStorage.setItem(certificateTemplateKey, JSON.stringify(certificateTemplate));
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const renderToggle = (key: string, value: boolean) => (
    <button
      type="button"
      onClick={() => handleChange(key, !value)}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        value ? 'bg-primary' : 'bg-muted'
      }`}
    >
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
        value ? 'start-7' : 'start-1'
      }`} />
    </button>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href={`/${locale}/admin`}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Arrow className="h-5 w-5" />
              <span>{isRTL ? 'بازگشت' : 'Back'}</span>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <h1 className="font-semibold">{isRTL ? 'تنظیمات سیستم' : 'System Settings'}</h1>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isSaving ? (
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : saveSuccess ? (
              <Check className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {saveSuccess ? (isRTL ? 'ذخیره شد' : 'Saved') : (isRTL ? 'ذخیره' : 'Save')}
            </span>
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Tabs */}
          <div className="lg:w-56 flex-shrink-0">
            <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="bg-card border rounded-xl p-6">
                  <h2 className="font-semibold mb-4 flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    {isRTL ? 'تنظیمات عمومی' : 'General Settings'}
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">
                        {isRTL ? 'نام سایت' : 'Site Name'}
                      </label>
                      <input
                        type="text"
                        value={settings.siteName}
                        onChange={(e) => handleChange('siteName', e.target.value)}
                        className="w-full p-3 rounded-lg border bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">
                        {isRTL ? 'توضیحات سایت' : 'Site Description'}
                      </label>
                      <textarea
                        value={settings.siteDescription}
                        onChange={(e) => handleChange('siteDescription', e.target.value)}
                        rows={2}
                        className="w-full p-3 rounded-lg border bg-background resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">
                        {isRTL ? 'زبان پیش‌فرض' : 'Default Language'}
                      </label>
                      <select
                        value={settings.defaultLanguage}
                        onChange={(e) => handleChange('defaultLanguage', e.target.value)}
                        className="w-full p-3 rounded-lg border bg-background"
                      >
                        <option value="fa">فارسی</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between py-3 border-t">
                      <div>
                        <p className="font-medium">{isRTL ? 'اجازه ثبت‌نام' : 'Allow Registration'}</p>
                        <p className="text-sm text-muted-foreground">
                          {isRTL ? 'کاربران جدید می‌توانند ثبت‌نام کنند' : 'New users can register'}
                        </p>
                      </div>
                      {renderToggle('allowRegistration', settings.allowRegistration)}
                    </div>
                    <div className="flex items-center justify-between py-3 border-t">
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          {isRTL ? 'حالت تعمیر' : 'Maintenance Mode'}
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {isRTL ? 'سایت برای کاربران غیرفعال می‌شود' : 'Site will be disabled for users'}
                        </p>
                      </div>
                      {renderToggle('maintenanceMode', settings.maintenanceMode)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="bg-card border rounded-xl p-6">
                  <h2 className="font-semibold mb-4 flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    {isRTL ? 'تنظیمات اعلان‌ها' : 'Notification Settings'}
                  </h2>
                  <div className="space-y-1">
                    {[
                      { key: 'emailNotifications', label: isRTL ? 'اعلان‌های ایمیل' : 'Email Notifications', desc: isRTL ? 'ارسال اعلان از طریق ایمیل' : 'Send notifications via email' },
                      { key: 'pushNotifications', label: isRTL ? 'اعلان‌های پوش' : 'Push Notifications', desc: isRTL ? 'اعلان‌های فوری مرورگر' : 'Browser push notifications' },
                      { key: 'newTeacherNotify', label: isRTL ? 'معلم جدید' : 'New Teacher', desc: isRTL ? 'اعلان هنگام ثبت‌نام معلم جدید' : 'Notify when new teacher registers' },
                      { key: 'newStudentNotify', label: isRTL ? 'دانش‌آموز جدید' : 'New Student', desc: isRTL ? 'اعلان هنگام ثبت‌نام دانش‌آموز' : 'Notify when new student enrolls' },
                      { key: 'courseCompletionNotify', label: isRTL ? 'تکمیل دوره' : 'Course Completion', desc: isRTL ? 'اعلان تکمیل دوره توسط دانش‌آموزان' : 'Notify when students complete courses' },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between py-3 border-t first:border-t-0">
                        <div>
                          <p className="font-medium">{item.label}</p>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                        {renderToggle(item.key, settings[item.key as keyof typeof settings] as boolean)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="bg-card border rounded-xl p-6">
                  <h2 className="font-semibold mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    {isRTL ? 'تنظیمات امنیتی' : 'Security Settings'}
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium">{isRTL ? 'احراز هویت دو مرحله‌ای' : 'Two-Factor Auth'}</p>
                        <p className="text-sm text-muted-foreground">
                          {isRTL ? 'فعال‌سازی 2FA برای همه کاربران' : 'Enable 2FA for all users'}
                        </p>
                      </div>
                      {renderToggle('twoFactorAuth', settings.twoFactorAuth)}
                    </div>
                    <div className="border-t pt-4">
                      <label className="text-sm text-muted-foreground mb-1 block">
                        {isRTL ? 'زمان پایان نشست (دقیقه)' : 'Session Timeout (minutes)'}
                      </label>
                      <input
                        type="number"
                        value={settings.sessionTimeout}
                        onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value))}
                        className="w-full p-3 rounded-lg border bg-background"
                        min="5"
                        max="480"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">
                        {isRTL ? 'حداکثر تلاش ورود' : 'Max Login Attempts'}
                      </label>
                      <input
                        type="number"
                        value={settings.maxLoginAttempts}
                        onChange={(e) => handleChange('maxLoginAttempts', parseInt(e.target.value))}
                        className="w-full p-3 rounded-lg border bg-background"
                        min="3"
                        max="10"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">
                        {isRTL ? 'حداقل طول رمز عبور' : 'Min Password Length'}
                      </label>
                      <input
                        type="number"
                        value={settings.passwordMinLength}
                        onChange={(e) => handleChange('passwordMinLength', parseInt(e.target.value))}
                        className="w-full p-3 rounded-lg border bg-background"
                        min="6"
                        max="32"
                      />
                    </div>
                    <div className="flex items-center justify-between py-3 border-t">
                      <div>
                        <p className="font-medium">{isRTL ? 'رمز عبور قوی' : 'Strong Password'}</p>
                        <p className="text-sm text-muted-foreground">
                          {isRTL ? 'شامل حروف بزرگ، کوچک، عدد و نماد' : 'Include uppercase, lowercase, numbers & symbols'}
                        </p>
                      </div>
                      {renderToggle('requireStrongPassword', settings.requireStrongPassword)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Teachers Settings */}
            {activeTab === 'teachers' && (
              <div className="space-y-6">
                <div className="bg-card border rounded-xl p-6">
                  <h2 className="font-semibold mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    {isRTL ? 'تنظیمات معلمان' : 'Teacher Settings'}
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium">{isRTL ? 'تأیید خودکار معلمان' : 'Auto-Approve Teachers'}</p>
                        <p className="text-sm text-muted-foreground">
                          {isRTL ? 'معلمان جدید بدون نیاز به تأیید فعال شوند' : 'New teachers activated without approval'}
                        </p>
                      </div>
                      {renderToggle('autoApproveTeachers', settings.autoApproveTeachers)}
                    </div>
                    <div className="border-t pt-4">
                      <label className="text-sm text-muted-foreground mb-1 block">
                        {isRTL ? 'حداکثر دانش‌آموز برای هر معلم' : 'Max Students Per Teacher'}
                      </label>
                      <input
                        type="number"
                        value={settings.maxStudentsPerTeacher}
                        onChange={(e) => handleChange('maxStudentsPerTeacher', parseInt(e.target.value))}
                        className="w-full p-3 rounded-lg border bg-background"
                        min="10"
                        max="200"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">
                        {isRTL ? 'حداکثر دروس برای هر معلم' : 'Max Courses Per Teacher'}
                      </label>
                      <input
                        type="number"
                        value={settings.maxCoursesPerTeacher}
                        onChange={(e) => handleChange('maxCoursesPerTeacher', parseInt(e.target.value))}
                        className="w-full p-3 rounded-lg border bg-background"
                        min="1"
                        max="50"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Courses Settings */}
            {activeTab === 'courses' && (
              <div className="space-y-6">
                <div className="bg-card border rounded-xl p-6">
                  <h2 className="font-semibold mb-4 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    {isRTL ? 'تنظیمات دروس' : 'Course Settings'}
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium">{isRTL ? 'اجازه دروس پیش‌نویس' : 'Allow Draft Courses'}</p>
                        <p className="text-sm text-muted-foreground">
                          {isRTL ? 'معلمان می‌توانند دروس پیش‌نویس ایجاد کنند' : 'Teachers can create draft courses'}
                        </p>
                      </div>
                      {renderToggle('allowDraftCourses', settings.allowDraftCourses)}
                    </div>
                    <div className="flex items-center justify-between py-3 border-t">
                      <div>
                        <p className="font-medium">{isRTL ? 'نیاز به تأیید دروس' : 'Require Course Approval'}</p>
                        <p className="text-sm text-muted-foreground">
                          {isRTL ? 'دروس قبل از انتشار باید تأیید شوند' : 'Courses must be approved before publishing'}
                        </p>
                      </div>
                      {renderToggle('requireCourseApproval', settings.requireCourseApproval)}
                    </div>
                    <div className="border-t pt-4">
                      <label className="text-sm text-muted-foreground mb-1 block">
                        {isRTL ? 'حداکثر درس در هر دوره' : 'Max Lessons Per Course'}
                      </label>
                      <input
                        type="number"
                        value={settings.maxLessonsPerCourse}
                        onChange={(e) => handleChange('maxLessonsPerCourse', parseInt(e.target.value))}
                        className="w-full p-3 rounded-lg border bg-background"
                        min="5"
                        max="100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Certificate Template Settings */}
            {activeTab === 'certificate' && (
              <div className="space-y-6">
                <div className="bg-card border rounded-xl p-6">
                  <h2 className="font-semibold mb-4 flex items-center gap-2">
                    <Palette className="h-5 w-5 text-primary" />
                    {isRTL ? 'طراحی گواهی‌نامه' : 'Certificate Designer'}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    {isRTL
                      ? 'هویت بصری پلتفرم را مشخص کنید و اجزای گواهی را اضافه/حذف کنید.'
                      : 'Set platform identity and add/remove certificate elements.'}
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">
                        {isRTL ? 'نام برند روی گواهی' : 'Brand Name on Certificate'}
                      </label>
                      <input
                        type="text"
                        value={certificateTemplate.brandName}
                        onChange={(e) => handleTemplateChange('brandName', e.target.value)}
                        className="w-full p-3 rounded-lg border bg-background"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">
                        {isRTL ? 'شعار برند' : 'Brand Tagline'}
                      </label>
                      <input
                        type="text"
                        value={certificateTemplate.tagLine}
                        onChange={(e) => handleTemplateChange('tagLine', e.target.value)}
                        className="w-full p-3 rounded-lg border bg-background"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">
                          {isRTL ? 'وب‌سایت' : 'Website'}
                        </label>
                        <input
                          type="text"
                          value={certificateTemplate.website}
                          onChange={(e) => handleTemplateChange('website', e.target.value)}
                          className="w-full p-3 rounded-lg border bg-background"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">
                          {isRTL ? 'صادرکننده' : 'Issuer Name'}
                        </label>
                        <input
                          type="text"
                          value={certificateTemplate.issuerName}
                          onChange={(e) => handleTemplateChange('issuerName', e.target.value)}
                          className="w-full p-3 rounded-lg border bg-background"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">
                          {isRTL ? 'رنگ اصلی' : 'Primary Color'}
                        </label>
                        <input
                          type="color"
                          value={certificateTemplate.primaryColor}
                          onChange={(e) => handleTemplateChange('primaryColor', e.target.value)}
                          className="w-full h-10 p-1 rounded-lg border bg-background"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">
                          {isRTL ? 'رنگ مکمل' : 'Accent Color'}
                        </label>
                        <input
                          type="color"
                          value={certificateTemplate.accentColor}
                          onChange={(e) => handleTemplateChange('accentColor', e.target.value)}
                          className="w-full h-10 p-1 rounded-lg border bg-background"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">
                          {isRTL ? 'رنگ پس‌زمینه' : 'Background Color'}
                        </label>
                        <input
                          type="color"
                          value={certificateTemplate.backgroundColor}
                          onChange={(e) => handleTemplateChange('backgroundColor', e.target.value)}
                          className="w-full h-10 p-1 rounded-lg border bg-background"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t space-y-1">
                      {[
                        { key: 'showBorder', label: isRTL ? 'نمایش کادر' : 'Show Border' },
                        { key: 'showHeaderBar', label: isRTL ? 'نمایش نوار هدر' : 'Show Header Bar' },
                        { key: 'showSeal', label: isRTL ? 'نمایش مُهر' : 'Show Seal' },
                        { key: 'showSignatureLine', label: isRTL ? 'نمایش خط امضا' : 'Show Signature Line' },
                        { key: 'showWebsiteFooter', label: isRTL ? 'نمایش وب‌سایت در پایین' : 'Show Website Footer' },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between py-3 border-t first:border-t-0">
                          <p className="font-medium">{item.label}</p>
                          {renderToggle(
                            item.key,
                            certificateTemplate[item.key as keyof typeof certificateTemplate] as boolean
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
