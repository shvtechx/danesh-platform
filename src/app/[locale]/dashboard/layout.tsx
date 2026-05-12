import { StudentShell } from '@/components/layout/StudentShell';

interface DashboardLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

export default function DashboardLayout({ children, params: { locale } }: DashboardLayoutProps) {
  return <StudentShell locale={locale}>{children}</StudentShell>;
}
