import { SectionNav } from '@/components/layout/SectionNav';

export default function AdminLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <div>
      <SectionNav locale={locale} section="admin" />
      {children}
    </div>
  );
}
