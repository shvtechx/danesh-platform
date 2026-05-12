import { redirect } from 'next/navigation';

export default function StudentDashboardPage({ params: { locale } }: { params: { locale: string } }) {
  redirect(`/${locale}/dashboard`);
}
