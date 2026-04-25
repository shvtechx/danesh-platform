'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { 
  ArrowLeft, ArrowRight, Search, Filter, Plus, MoreVertical,
  GraduationCap, Users, BookOpen, Mail, Phone, Edit, Trash2,
  Eye, UserPlus, Download, Upload, ChevronDown, Check, X,
  Calendar, Award, Clock, Shield
} from 'lucide-react';

interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  department: string;
  students: number;
  courses: number;
  status: 'active' | 'inactive' | 'pending';
  joinDate: string;
  avatar: string;
}

export default function TeachersManagement({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations();
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  const departments = [
    { id: 'math', name: isRTL ? 'ریاضی' : 'Mathematics' },
    { id: 'science', name: isRTL ? 'علوم' : 'Science' },
    { id: 'language', name: isRTL ? 'زبان' : 'Languages' },
    { id: 'humanities', name: isRTL ? 'علوم انسانی' : 'Humanities' },
  ];

  const teachers: Teacher[] = [
    {
      id: 't1',
      name: isRTL ? 'دکتر علی احمدی' : 'Dr. Ali Ahmadi',
      email: 'ahmadi@danesh.edu',
      phone: '+98 912 345 6789',
      subject: isRTL ? 'ریاضی' : 'Mathematics',
      department: 'math',
      students: 156,
      courses: 4,
      status: 'active',
      joinDate: '2023-01-15',
      avatar: 'A',
    },
    {
      id: 't2',
      name: isRTL ? 'استاد سارا محمدی' : 'Prof. Sara Mohammadi',
      email: 'mohammadi@danesh.edu',
      phone: '+98 912 456 7890',
      subject: isRTL ? 'فیزیک' : 'Physics',
      department: 'science',
      students: 128,
      courses: 3,
      status: 'active',
      joinDate: '2023-03-20',
      avatar: 'S',
    },
    {
      id: 't3',
      name: isRTL ? 'خانم مریم رضایی' : 'Ms. Maryam Rezaei',
      email: 'rezaei@danesh.edu',
      phone: '+98 912 567 8901',
      subject: isRTL ? 'زبان انگلیسی' : 'English',
      department: 'language',
      students: 89,
      courses: 2,
      status: 'active',
      joinDate: '2023-06-10',
      avatar: 'M',
    },
    {
      id: 't4',
      name: isRTL ? 'آقای محمد کریمی' : 'Mr. Mohammad Karimi',
      email: 'karimi@danesh.edu',
      phone: '+98 912 678 9012',
      subject: isRTL ? 'شیمی' : 'Chemistry',
      department: 'science',
      students: 0,
      courses: 0,
      status: 'pending',
      joinDate: '2024-12-20',
      avatar: 'M',
    },
    {
      id: 't5',
      name: isRTL ? 'دکتر فاطمه حسینی' : 'Dr. Fateme Hosseini',
      email: 'hosseini@danesh.edu',
      phone: '+98 912 789 0123',
      subject: isRTL ? 'ادبیات فارسی' : 'Persian Literature',
      department: 'humanities',
      students: 72,
      courses: 2,
      status: 'inactive',
      joinDate: '2022-09-01',
      avatar: 'F',
    },
  ];

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         teacher.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         teacher.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || teacher.status === filterStatus;
    const matchesDepartment = filterDepartment === 'all' || teacher.department === filterDepartment;
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            {isRTL ? 'فعال' : 'Active'}
          </span>
        );
      case 'inactive':
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400">
            {isRTL ? 'غیرفعال' : 'Inactive'}
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
            {isRTL ? 'در انتظار' : 'Pending'}
          </span>
        );
      default:
        return null;
    }
  };

  const toggleSelectTeacher = (id: string) => {
    setSelectedTeachers(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedTeachers.length === filteredTeachers.length) {
      setSelectedTeachers([]);
    } else {
      setSelectedTeachers(filteredTeachers.map(t => t.id));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href={`/${locale}/admin`}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Arrow className="h-5 w-5" />
              <span>{isRTL ? 'بازگشت' : 'Back'}</span>
            </Link>
            <div className="h-6 w-px bg-border" />
            <h1 className="font-semibold">{isRTL ? 'مدیریت معلمان' : 'Teacher Management'}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-muted text-sm">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">{isRTL ? 'خروجی' : 'Export'}</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-muted text-sm">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">{isRTL ? 'ورود داده' : 'Import'}</span>
            </button>
            <Link
              href={`/${locale}/admin/teachers/new`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{isRTL ? 'افزودن معلم' : 'Add Teacher'}</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4 mb-6">
          <div className="bg-card border rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <GraduationCap className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{teachers.length}</p>
              <p className="text-sm text-muted-foreground">{isRTL ? 'کل معلمان' : 'Total Teachers'}</p>
            </div>
          </div>
          <div className="bg-card border rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{teachers.filter(t => t.status === 'active').length}</p>
              <p className="text-sm text-muted-foreground">{isRTL ? 'فعال' : 'Active'}</p>
            </div>
          </div>
          <div className="bg-card border rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{teachers.filter(t => t.status === 'pending').length}</p>
              <p className="text-sm text-muted-foreground">{isRTL ? 'در انتظار' : 'Pending'}</p>
            </div>
          </div>
          <div className="bg-card border rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{teachers.reduce((sum, t) => sum + t.students, 0)}</p>
              <p className="text-sm text-muted-foreground">{isRTL ? 'کل دانش‌آموزان' : 'Total Students'}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRTL ? 'جستجوی معلم...' : 'Search teachers...'}
              className="w-full ps-10 pe-4 py-2 rounded-lg border bg-background"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 rounded-lg border bg-background"
          >
            <option value="all">{isRTL ? 'همه وضعیت‌ها' : 'All Status'}</option>
            <option value="active">{isRTL ? 'فعال' : 'Active'}</option>
            <option value="inactive">{isRTL ? 'غیرفعال' : 'Inactive'}</option>
            <option value="pending">{isRTL ? 'در انتظار' : 'Pending'}</option>
          </select>
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-4 py-2 rounded-lg border bg-background"
          >
            <option value="all">{isRTL ? 'همه گروه‌ها' : 'All Departments'}</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedTeachers.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4 flex items-center justify-between">
            <span className="text-sm">
              {selectedTeachers.length} {isRTL ? 'معلم انتخاب شده' : 'teachers selected'}
            </span>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700">
                {isRTL ? 'فعال‌سازی' : 'Activate'}
              </button>
              <button className="px-3 py-1.5 rounded-lg bg-gray-600 text-white text-sm hover:bg-gray-700">
                {isRTL ? 'غیرفعال' : 'Deactivate'}
              </button>
              <button className="px-3 py-1.5 rounded-lg bg-destructive text-white text-sm hover:bg-destructive/90">
                {isRTL ? 'حذف' : 'Delete'}
              </button>
            </div>
          </div>
        )}

        {/* Teachers Table */}
        <div className="bg-card border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-4 text-start">
                    <input
                      type="checkbox"
                      checked={selectedTeachers.length === filteredTeachers.length && filteredTeachers.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="p-4 text-start font-medium text-sm">
                    {isRTL ? 'معلم' : 'Teacher'}
                  </th>
                  <th className="p-4 text-start font-medium text-sm hidden md:table-cell">
                    {isRTL ? 'تماس' : 'Contact'}
                  </th>
                  <th className="p-4 text-start font-medium text-sm hidden lg:table-cell">
                    {isRTL ? 'موضوع' : 'Subject'}
                  </th>
                  <th className="p-4 text-center font-medium text-sm">
                    {isRTL ? 'دانش‌آموزان' : 'Students'}
                  </th>
                  <th className="p-4 text-center font-medium text-sm hidden sm:table-cell">
                    {isRTL ? 'دوره‌ها' : 'Courses'}
                  </th>
                  <th className="p-4 text-center font-medium text-sm">
                    {isRTL ? 'وضعیت' : 'Status'}
                  </th>
                  <th className="p-4 text-center font-medium text-sm">
                    {isRTL ? 'عملیات' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-muted/30">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedTeachers.includes(teacher.id)}
                        onChange={() => toggleSelectTeacher(teacher.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                          {teacher.avatar}
                        </div>
                        <div>
                          <p className="font-medium">{teacher.name}</p>
                          <p className="text-xs text-muted-foreground md:hidden">{teacher.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <div className="text-sm">
                        <p className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {teacher.email}
                        </p>
                        <p className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" /> {teacher.phone}
                        </p>
                      </div>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <span className="px-2 py-1 rounded-lg bg-muted text-sm">{teacher.subject}</span>
                    </td>
                    <td className="p-4 text-center font-medium">{teacher.students}</td>
                    <td className="p-4 text-center hidden sm:table-cell">{teacher.courses}</td>
                    <td className="p-4 text-center">{getStatusBadge(teacher.status)}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          href={`/${locale}/admin/teachers/${teacher.id}`}
                          className="p-2 rounded-lg hover:bg-muted"
                          title={isRTL ? 'مشاهده' : 'View'}
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/${locale}/admin/teachers/${teacher.id}/edit`}
                          className="p-2 rounded-lg hover:bg-muted"
                          title={isRTL ? 'ویرایش' : 'Edit'}
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => setShowDeleteModal(teacher.id)}
                          className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"
                          title={isRTL ? 'حذف' : 'Delete'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTeachers.length === 0 && (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {isRTL ? 'معلمی یافت نشد' : 'No teachers found'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            {isRTL 
              ? `نمایش ${filteredTeachers.length} از ${teachers.length} معلم`
              : `Showing ${filteredTeachers.length} of ${teachers.length} teachers`}
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 rounded-lg border hover:bg-muted text-sm" disabled>
              {isRTL ? 'قبلی' : 'Previous'}
            </button>
            <button className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm">1</button>
            <button className="px-3 py-1.5 rounded-lg border hover:bg-muted text-sm">2</button>
            <button className="px-3 py-1.5 rounded-lg border hover:bg-muted text-sm">
              {isRTL ? 'بعدی' : 'Next'}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">
              {isRTL ? 'تأیید حذف' : 'Confirm Delete'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {isRTL 
                ? 'آیا مطمئن هستید که می‌خواهید این معلم را حذف کنید؟ این عمل قابل بازگشت نیست.'
                : 'Are you sure you want to delete this teacher? This action cannot be undone.'}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 rounded-lg border hover:bg-muted"
              >
                {isRTL ? 'انصراف' : 'Cancel'}
              </button>
              <button className="px-4 py-2 rounded-lg bg-destructive text-white hover:bg-destructive/90">
                {isRTL ? 'حذف' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
