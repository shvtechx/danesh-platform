'use client';

import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Import the exact same lesson player component used by students
const StudentLessonPlayer = dynamic(
  () => import('@/app/[locale]/student/lessons/[id]/learn/page'),
  { ssr: false }
);

/**
 * Admin Lesson Preview Page
 * 
 * This page allows administrators to preview lessons using the exact same
 * lesson player interface that students experience. This ensures consistency
 * and allows admins to QA content before it's released to students.
 */
export default function AdminLessonPreviewPage() {
  const params = useParams();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Preview Banner */}
      <div className="bg-blue-600 text-white py-2 px-4 text-center text-sm font-medium shadow-md">
        👨‍💼 Admin Preview Mode - This is exactly what students will see
      </div>

      {/* Render the student lesson player */}
      <StudentLessonPlayer />
    </div>
  );
}
