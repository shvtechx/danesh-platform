'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { jsPDF } from 'jspdf';
import { User, Mail, Phone, MapPin, Calendar, BookOpen, Trophy, Flame, Star, Edit } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';

export default function ProfilePage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations();
  const router = useRouter();
  const isRTL = locale === 'fa';

  const downloadCertificate = (title: string, issuedAt: string) => {
    const certificateTemplateKey = 'danesh.admin.certificateTemplate.v1';
    const defaultTemplate = {
      brandName: 'Danesh Learning Platform',
      tagLine: 'Learn • Grow • Achieve',
      website: 'www.danesh.app',
      issuerName: 'Danesh Academic Office',
      primaryColor: '#152E58',
      accentColor: '#B98631',
      backgroundColor: '#F8F9FC',
      showBorder: true,
      showHeaderBar: true,
      showSeal: true,
      showSignatureLine: true,
      showWebsiteFooter: true,
    };

    const template = (() => {
      try {
        const raw = localStorage.getItem(certificateTemplateKey);
        if (!raw) return defaultTemplate;
        return { ...defaultTemplate, ...JSON.parse(raw) };
      } catch {
        return defaultTemplate;
      }
    })();

    const toRgb = (hex: string) => {
      const value = hex.replace('#', '').trim();
      if (!/^[0-9A-Fa-f]{6}$/.test(value)) return [21, 46, 88] as const;
      return [
        parseInt(value.slice(0, 2), 16),
        parseInt(value.slice(2, 4), 16),
        parseInt(value.slice(4, 6), 16),
      ] as const;
    };

    const [primaryR, primaryG, primaryB] = toRgb(template.primaryColor);
    const [accentR, accentG, accentB] = toRgb(template.accentColor);
    const [bgR, bgG, bgB] = toRgb(template.backgroundColor);

    // NOTE: jsPDF built-in fonts do not fully support Persian glyph shaping.
    // Use ASCII-safe content to avoid garbled characters in generated PDFs.
    const learnerName = 'Ali Ahmadi';
    const brandName = (template.brandName || 'Danesh Learning Platform').normalize('NFKD').replace(/[^\x20-\x7E]/g, '').trim() || 'Danesh Learning Platform';
    const tagLine = (template.tagLine || '').normalize('NFKD').replace(/[^\x20-\x7E]/g, '').trim();
    const website = (template.website || '').normalize('NFKD').replace(/[^\x20-\x7E]/g, '').trim();
    const issuerName = (template.issuerName || 'Danesh Academic Office').normalize('NFKD').replace(/[^\x20-\x7E]/g, '').trim() || 'Danesh Academic Office';
    const normalizedTitle = title
      .normalize('NFKD')
      .replace(/[^\x20-\x7E]/g, '')
      .trim() || 'Course Completion';
    const normalizedIssuedAt = issuedAt
      .normalize('NFKD')
      .replace(/[^\x20-\x7E]/g, '')
      .trim() || '2026';
    const certificateId = `DAN-${Date.now().toString().slice(-8)}`;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // Elegant frame and color family (navy + gold)
    doc.setFillColor(bgR, bgG, bgB);
    doc.rect(0, 0, 297, 210, 'F');

    if (template.showBorder) {
      doc.setDrawColor(primaryR, primaryG, primaryB);
      doc.setLineWidth(2.2);
      doc.rect(10, 10, 277, 190);
      doc.setLineWidth(0.6);
      doc.rect(14, 14, 269, 182);
    }

    if (template.showHeaderBar) {
      doc.setFillColor(primaryR, primaryG, primaryB);
      doc.rect(14, 14, 269, 18, 'F');
    }

    doc.setFont('times', 'bold');
    doc.setTextColor(template.showHeaderBar ? 255 : primaryR, template.showHeaderBar ? 255 : primaryG, template.showHeaderBar ? 255 : primaryB);
    doc.setFontSize(20);
    doc.text(brandName.toUpperCase(), 148.5, 26, { align: 'center' });
    if (tagLine) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(tagLine, 148.5, 32, { align: 'center' });
    }

    doc.setTextColor(accentR, accentG, accentB);
    doc.setFont('times', 'bold');
    doc.setFontSize(40);
    doc.text('Certificate of Completion', 148.5, 60, { align: 'center' });

    doc.setTextColor(55, 65, 81);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.text('This certifies that', 148.5, 80, { align: 'center' });

    doc.setTextColor(17, 24, 39);
    doc.setFont('times', 'bold');
    doc.setFontSize(24);
    doc.text(learnerName, 148.5, 97, { align: 'center' });

    doc.setTextColor(55, 65, 81);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.text('has successfully completed the course', 148.5, 111, { align: 'center' });

    doc.setTextColor(primaryR, primaryG, primaryB);
    doc.setFont('times', 'bold');
    doc.setFontSize(18);
    doc.text(`"${normalizedTitle}"`, 148.5, 125, { align: 'center' });

    doc.setDrawColor(accentR, accentG, accentB);
    doc.setLineWidth(1.2);
    doc.line(92, 131, 205, 131);

    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`Issued: ${normalizedIssuedAt}`, 55, 155);
    doc.text(`Certificate ID: ${certificateId}`, 55, 164);
    doc.text(`Issued by: ${issuerName}`, 55, 173);

    if (template.showSignatureLine) {
      doc.setDrawColor(primaryR, primaryG, primaryB);
      doc.line(190, 160, 255, 160);
      doc.setFontSize(11);
      doc.text('Authorized Signature', 222.5, 167, { align: 'center' });
    }

    if (template.showSeal) {
      doc.setDrawColor(accentR, accentG, accentB);
      doc.setLineWidth(1.1);
      doc.circle(255, 52, 14);
      doc.setFont('times', 'bold');
      doc.setTextColor(accentR, accentG, accentB);
      doc.setFontSize(9);
      doc.text('OFFICIAL', 255, 49, { align: 'center' });
      doc.text('CERTIFIED', 255, 55, { align: 'center' });
    }

    if (template.showWebsiteFooter && website) {
      doc.setTextColor(107, 114, 128);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(website, 148.5, 193, { align: 'center' });
    }

    doc.save(`certificate-${certificateId}.pdf`);
  };

  const stats = [
    { label: isRTL ? 'دوره‌های تکمیل شده' : 'Courses Completed', value: 12, icon: BookOpen },
    { label: t('gamification.xp'), value: '2,450', icon: Star },
    { label: t('gamification.currentStreak'), value: 14, icon: Flame },
    { label: t('gamification.achievements'), value: 8, icon: Trophy },
  ];

  const recentActivity = [
    {
      id: '1',
      action: isRTL ? 'درس ریاضی تکمیل شد' : 'Completed Math lesson',
      time: isRTL ? '۲ ساعت پیش' : '2 hours ago',
      xp: 50,
    },
    {
      id: '2',
      action: isRTL ? 'نشان جدید کسب شد' : 'Earned new badge',
      time: isRTL ? '۵ ساعت پیش' : '5 hours ago',
      xp: 100,
    },
    {
      id: '3',
      action: isRTL ? 'آزمون علوم انجام شد' : 'Completed Science quiz',
      time: isRTL ? '۱ روز پیش' : '1 day ago',
      xp: 75,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        locale={locale} 
        title={t('profile.title')}
        backHref={`/${locale}/dashboard`}
        backLabel={isRTL ? 'داشبورد' : 'Dashboard'}
      />
      <div className="space-y-8 p-6">
        {/* Profile Header */}
        <div className="rounded-2xl border bg-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-4xl text-white font-bold">
              {isRTL ? 'ع' : 'A'}
            </div>
            <button
              onClick={() => router.push(`/${locale}/settings#profile`)}
              className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-primary-foreground hover:bg-primary/90"
            >
              <Edit className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{isRTL ? 'علی احمدی' : 'Ali Ahmadi'}</h1>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                {t('gamification.level')} 12
              </span>
            </div>
            <p className="text-muted-foreground mt-1">
              {isRTL ? 'دانش‌آموز پایه هشتم' : 'Grade 8 Student'}
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                ali@example.com
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {isRTL ? 'تهران، ایران' : 'Tehran, Iran'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {isRTL ? 'عضویت از مهر ۱۴۰۴' : 'Joined Sep 2025'}
              </span>
            </div>
          </div>
          <button
            onClick={() => router.push(`/${locale}/settings#profile`)}
            className="rounded-lg border px-4 py-2 hover:bg-muted transition-colors"
          >
            {t('profile.editProfile')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Progress */}
        <div className="rounded-2xl border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">{t('profile.myProgress')}</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>{isRTL ? 'ریاضی' : 'Mathematics'}</span>
                <span className="font-medium">85%</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-full w-[85%] rounded-full bg-primary" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>{isRTL ? 'علوم' : 'Science'}</span>
                <span className="font-medium">72%</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-full w-[72%] rounded-full bg-emerald-500" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>{isRTL ? 'انگلیسی' : 'English'}</span>
                <span className="font-medium">90%</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-full w-[90%] rounded-full bg-blue-500" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>{isRTL ? 'ادبیات' : 'Literature'}</span>
                <span className="font-medium">65%</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-full w-[65%] rounded-full bg-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">{t('dashboard.recentActivity')}</h2>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">{activity.time}</p>
                </div>
                <span className="rounded-full bg-primary/10 px-2 py-1 text-sm font-medium text-primary">
                  +{activity.xp} XP
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Certificates */}
      <div className="rounded-2xl border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">{t('profile.certificates')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10">
            <Trophy className="h-8 w-8 text-amber-500 mb-3" />
            <h3 className="font-semibold">{isRTL ? 'گواهی تکمیل ریاضی' : 'Math Completion Certificate'}</h3>
            <p className="text-sm text-muted-foreground mt-1">{isRTL ? 'فروردین ۱۴۰۵' : 'April 2026'}</p>
            <button
              onClick={() => downloadCertificate('Mathematics', 'April 2026')}
              className="mt-3 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
            >
              {isRTL ? 'دانلود گواهی' : 'Download certificate'}
            </button>
          </div>
          <div className="rounded-xl border p-4 bg-gradient-to-br from-blue-500/10 to-indigo-500/10">
            <Trophy className="h-8 w-8 text-blue-500 mb-3" />
            <h3 className="font-semibold">{isRTL ? 'گواهی تکمیل انگلیسی' : 'English Completion Certificate'}</h3>
            <p className="text-sm text-muted-foreground mt-1">{isRTL ? 'اسفند ۱۴۰۴' : 'March 2026'}</p>
            <button
              onClick={() => downloadCertificate('English Language', 'March 2026')}
              className="mt-3 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
            >
              {isRTL ? 'دانلود گواهی' : 'Download certificate'}
            </button>
          </div>
          <div className="rounded-xl border p-4 border-dashed flex items-center justify-center">
            <p className="text-muted-foreground text-center">
              {isRTL ? 'دوره بعدی را تکمیل کنید' : 'Complete next course'}
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
