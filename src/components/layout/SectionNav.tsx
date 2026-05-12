'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Award, BookOpen, FileText, GraduationCap, LayoutDashboard, LineChart, Settings, Users } from 'lucide-react';

interface SectionNavProps {
  locale: string;
  section: 'admin' | 'teacher';
}

export function SectionNav({ locale, section }: SectionNavProps) {
  const pathname = usePathname();
  const isRTL = locale === 'fa';

  const items = section === 'admin'
    ? [
        { href: `/${locale}/admin`, label: isRTL ? 'داشبورد' : 'Dashboard', icon: LayoutDashboard },
        { href: `/${locale}/admin/users`, label: isRTL ? 'کاربران' : 'Users', icon: Users },
        { href: `/${locale}/admin/teachers`, label: isRTL ? 'معلمان' : 'Teachers', icon: GraduationCap },
        { href: `/${locale}/admin/subjects`, label: isRTL ? 'موضوعات' : 'Subjects', icon: FileText },
        { href: `/${locale}/admin/courses`, label: isRTL ? 'دوره‌ها' : 'Courses', icon: BookOpen },
        { href: `/${locale}/admin/reports`, label: isRTL ? 'گزارش‌ها' : 'Reports', icon: LineChart },
        { href: `/${locale}/admin/settings`, label: isRTL ? 'تنظیمات' : 'Settings', icon: Settings },
      ]
    : [
        { href: `/${locale}/teacher`, label: isRTL ? 'داشبورد' : 'Dashboard', icon: LayoutDashboard },
        { href: `/${locale}/teacher/courses`, label: isRTL ? 'دوره‌ها' : 'Courses', icon: BookOpen },
        { href: `/${locale}/teacher/content`, label: isRTL ? 'محتوا' : 'Content', icon: FileText },
        { href: `/${locale}/teacher/students`, label: isRTL ? 'دانش‌آموزان' : 'Students', icon: Users },
        { href: `/${locale}/teacher/gradebook`, label: isRTL ? 'دفتر نمره' : 'Gradebook', icon: Award },
        { href: `/${locale}/teacher/reports`, label: isRTL ? 'گزارش‌ها' : 'Reports', icon: LineChart },
        { href: `/${locale}/teacher/settings`, label: isRTL ? 'تنظیمات' : 'Settings', icon: Settings },
      ];

  return (
    <div className="border-b bg-muted/30">
      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors ${
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'border bg-background text-muted-foreground hover:text-foreground hover:border-primary/30'
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
