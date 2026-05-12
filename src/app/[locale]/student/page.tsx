import { redirect } from 'next/navigation';

export default function StudentPage({ params: { locale } }: { params: { locale: string } }) {
  redirect(`/${locale}/dashboard`);
}
