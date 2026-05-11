'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Clock, Edit, Eye, GraduationCap, Mail, Phone, Plus, Search, Trash2, Users } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { TEACHER_DEPARTMENTS } from '@/lib/admin/teacher-metadata';

interface TeacherRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  department: string | null;
  departmentLabel: string;
  students: number;
  courses: number;
  status: 'active' | 'inactive' | 'pending';
  joinDate: string;
  avatar: string;
}

export default function TeachersManagement({ params: { locale } }: { params: { locale: string } }) {
  const isRTL = locale === 'fa';
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTeachers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/admin/teachers?locale=${locale}`, { cache: 'no-store' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'failed_to_load_teachers');
      }

      setTeachers(data.teachers || []);
    } catch {
      setTeachers([]);
      setError(isRTL ? 'بارگیری فهرست معلمان انجام نشد.' : 'Unable to load the teacher list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, [locale]);

  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher) => {
      const matchesSearch = [teacher.name, teacher.email, teacher.subject]
        .join(' ')
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || teacher.status === filterStatus;
      const matchesDepartment = filterDepartment === 'all' || teacher.department === filterDepartment;
      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [filterDepartment, filterStatus, searchQuery, teachers]);

  const stats = {
    totalTeachers: teachers.length,
    activeTeachers: teachers.filter((teacher) => teacher.status === 'active').length,
    pendingTeachers: teachers.filter((teacher) => teacher.status === 'pending').length,
    totalStudents: teachers.reduce((sum, teacher) => sum + teacher.students, 0),
  };

  const getStatusBadge = (status: TeacherRecord['status']) => {
    if (status === 'active') {
      return <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400">{isRTL ? 'فعال' : 'Active'}</span>;
    }
    if (status === 'inactive') {
      return <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-900/30 dark:text-gray-400">{isRTL ? 'غیرفعال' : 'Inactive'}</span>;
    }
    return <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">{isRTL ? 'در انتظار' : 'Pending'}</span>;
  };

  const handleDelete = async () => {
    if (!showDeleteModal) {
      return;
    }

    setSubmittingDelete(true);
    try {
      const response = await fetch(`/api/v1/admin/teachers/${showDeleteModal}`, { method: 'DELETE' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'failed_to_delete_teacher');
      }

      setTeachers((prev) => prev.filter((teacher) => teacher.id !== showDeleteModal));
      setShowDeleteModal(null);
    } catch {
      setError(isRTL ? 'حذف معلم انجام نشد.' : 'Unable to delete the teacher.');
    } finally {
      setSubmittingDelete(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        locale={locale}
        title={isRTL ? 'مدیریت معلمان' : 'Teacher Management'}
        backHref={`/${locale}/admin`}
        backLabel={isRTL ? 'بازگشت به مدیریت' : 'Back to admin'}
      >
        <Link
          href={`/${locale}/admin/teachers/new`}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          <span>{isRTL ? 'افزودن معلم' : 'Add Teacher'}</span>
        </Link>
      </PageHeader>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
            <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
              <GraduationCap className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalTeachers}</p>
              <p className="text-sm text-muted-foreground">{isRTL ? 'کل معلمان' : 'Total Teachers'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
            <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.activeTeachers}</p>
              <p className="text-sm text-muted-foreground">{isRTL ? 'فعال' : 'Active'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
            <div className="rounded-lg bg-yellow-100 p-2 dark:bg-yellow-900/30">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pendingTeachers}</p>
              <p className="text-sm text-muted-foreground">{isRTL ? 'در انتظار' : 'Pending'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
            <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalStudents}</p>
              <p className="text-sm text-muted-foreground">{isRTL ? 'دانش‌آموزان تخصیص‌یافته' : 'Assigned Students'}</p>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={isRTL ? 'جستجوی معلم...' : 'Search teachers...'}
              className="w-full rounded-lg border bg-background py-2 pe-4 ps-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value)}
            className="rounded-lg border bg-background px-4 py-2"
          >
            <option value="all">{isRTL ? 'همه وضعیت‌ها' : 'All statuses'}</option>
            <option value="active">{isRTL ? 'فعال' : 'Active'}</option>
            <option value="inactive">{isRTL ? 'غیرفعال' : 'Inactive'}</option>
            <option value="pending">{isRTL ? 'در انتظار' : 'Pending'}</option>
          </select>
          <select
            value={filterDepartment}
            onChange={(event) => setFilterDepartment(event.target.value)}
            className="rounded-lg border bg-background px-4 py-2"
          >
            <option value="all">{isRTL ? 'همه گروه‌ها' : 'All departments'}</option>
            {TEACHER_DEPARTMENTS.map((department) => (
              <option key={department.id} value={department.id}>
                {isRTL ? department.labels.fa : department.labels.en}
              </option>
            ))}
          </select>
        </div>

        {error && <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}

        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-4 text-start text-sm font-medium">{isRTL ? 'معلم' : 'Teacher'}</th>
                  <th className="hidden p-4 text-start text-sm font-medium md:table-cell">{isRTL ? 'تماس' : 'Contact'}</th>
                  <th className="hidden p-4 text-start text-sm font-medium lg:table-cell">{isRTL ? 'موضوع' : 'Subject'}</th>
                  <th className="p-4 text-center text-sm font-medium">{isRTL ? 'وضعیت' : 'Status'}</th>
                  <th className="p-4 text-center text-sm font-medium">{isRTL ? 'عملیات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-muted-foreground">
                      {isRTL ? 'در حال بارگیری...' : 'Loading...'}
                    </td>
                  </tr>
                ) : filteredTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-muted-foreground">
                      {isRTL ? 'معلمی یافت نشد.' : 'No teachers found.'}
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-muted/30">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                            {teacher.avatar}
                          </div>
                          <div>
                            <p className="font-medium">{teacher.name}</p>
                            <p className="text-xs text-muted-foreground">{teacher.departmentLabel}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden p-4 md:table-cell">
                        <div className="space-y-1 text-sm">
                          <p className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span>{teacher.email}</span>
                          </p>
                          <p className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{teacher.phone || (isRTL ? 'ثبت نشده' : 'Not provided')}</span>
                          </p>
                        </div>
                      </td>
                      <td className="hidden p-4 lg:table-cell">
                        <span className="rounded-lg bg-muted px-2 py-1 text-sm">{teacher.subject}</span>
                      </td>
                      <td className="p-4 text-center">{getStatusBadge(teacher.status)}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1">
                          <Link href={`/${locale}/admin/teachers/${teacher.id}`} className="rounded-lg p-2 hover:bg-muted" title={isRTL ? 'مشاهده' : 'View'}>
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link href={`/${locale}/admin/teachers/${teacher.id}/edit`} className="rounded-lg p-2 hover:bg-muted" title={isRTL ? 'ویرایش' : 'Edit'}>
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => setShowDeleteModal(teacher.id)}
                            className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                            title={isRTL ? 'حذف' : 'Delete'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          {isRTL ? `نمایش ${filteredTeachers.length} از ${teachers.length} معلم` : `Showing ${filteredTeachers.length} of ${teachers.length} teachers`}
        </p>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6">
            <h3 className="mb-2 text-lg font-semibold">{isRTL ? 'تأیید حذف' : 'Confirm delete'}</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {isRTL ? 'این معلم از فهرست و پایگاه‌داده حذف می‌شود.' : 'This teacher will be removed from the database and the list.'}
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDeleteModal(null)} className="rounded-lg border px-4 py-2 hover:bg-muted">
                {isRTL ? 'انصراف' : 'Cancel'}
              </button>
              <button
                onClick={handleDelete}
                disabled={submittingDelete}
                className="rounded-lg bg-destructive px-4 py-2 text-white hover:bg-destructive/90 disabled:opacity-60"
              >
                {submittingDelete ? (isRTL ? 'در حال حذف...' : 'Deleting...') : (isRTL ? 'حذف' : 'Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
