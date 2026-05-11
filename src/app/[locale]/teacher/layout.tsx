import { SectionNav } from '@/components/layout/SectionNav';

export default function TeacherLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <div>
      <SectionNav locale={locale} section="teacher" />
      {children}
    </div>
  );
}
