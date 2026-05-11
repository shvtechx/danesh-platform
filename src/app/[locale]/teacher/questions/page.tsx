'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createUserHeaders, getStoredUserId } from '@/lib/auth/demo-auth-shared';
import { 
  ArrowLeft, ArrowRight, Search, Filter, Download, Printer,
  CheckSquare, Square, Eye, Plus, Trash2, X 
} from 'lucide-react';

interface TeacherQuestionsPageProps {
  params: { locale: string };
}

interface QuestionOption {
  id: string;
  text: string;
  textFA: string;
  isCorrect: boolean;
  feedback: string;
  feedbackFA: string;
  order: number;
}

interface Question {
  id: string;
  type: string;
  stem: string;
  stemFA: string;
  explanation: string;
  explanationFA: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  bloomLevel: string;
  metadata: {
    phase5E: string;
    subjectCode: string;
  };
  options: QuestionOption[];
  gradeLevel: {
    code: string;
    name: string;
    nameFA: string;
    gradeBand: string;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface TeacherCourseOption {
  id: string;
  title: string;
  gradeCode: string;
  subjectCode: string;
  subject: string;
}

interface PrintExportOptions {
  format: 'quiz' | 'exam' | 'practice';
  title: string;
  subtitle: string;
  includeAnswerKey: boolean;
}

const SUBJECTS = [
  { code: 'MATH', name: 'Mathematics', nameFA: 'ریاضیات' },
  { code: 'SCI', name: 'Science', nameFA: 'علوم' },
  { code: 'ENG', name: 'English', nameFA: 'انگلیسی' },
  { code: 'PER_LIT', name: 'Persian Literature', nameFA: 'ادبیات فارسی' },
  { code: 'SOC', name: 'Social Studies', nameFA: 'مطالعات اجتماعی' },
  { code: 'CS', name: 'Computer Science', nameFA: 'علوم کامپیوتر' },
  { code: 'ROBOT', name: 'Robotics', nameFA: 'رباتیک' },
  { code: 'AI', name: 'Artificial Intelligence', nameFA: 'هوش مصنوعی' },
  { code: 'ENTREP', name: 'Entrepreneurship', nameFA: 'کارآفرینی' },
  { code: 'ART', name: 'Visual Arts', nameFA: 'هنرهای تجسمی' },
  { code: 'MUS', name: 'Music', nameFA: 'موسیقی' },
  { code: 'PE', name: 'Physical Education', nameFA: 'تربیت بدنی' },
  { code: 'SEL', name: 'Social-Emotional Learning', nameFA: 'یادگیری اجتماعی-عاطفی' },
  { code: 'ETHICS', name: 'Ethics & Philosophy', nameFA: 'اخلاق و فلسفه' }
];

const GRADES = [
  'KG', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 
  'G7', 'G8', 'G9', 'G10', 'G11', 'G12'
];

const PHASES = [
  { code: '5E_ENGAGE', name: 'Engage', nameFA: 'تأثیر' },
  { code: '5E_EXPLORE', name: 'Explore', nameFA: 'تحقیق' },
  { code: '5E_EXPLAIN', name: 'Explain', nameFA: 'توضیح' },
  { code: '5E_ELABORATE', name: 'Elaborate', nameFA: 'تعمیم' },
  { code: '5E_EVALUATE', name: 'Evaluate', nameFA: 'تعیین' }
];

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'];

export default function TeacherQuestionsPage({ params: { locale } }: TeacherQuestionsPageProps) {
  const searchParams = useSearchParams();
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [teacherCourses, setTeacherCourses] = useState<TeacherCourseOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [printOptions, setPrintOptions] = useState<PrintExportOptions>({
    format: 'quiz',
    title: isRTL ? 'برگه سوال' : 'Question Set',
    subtitle: '',
    includeAnswerKey: true,
  });

  // Filters
  const [filters, setFilters] = useState({
    subject: '',
    grade: '',
    phase: '',
    difficulty: '',
    search: ''
  });

  const loadQuestions = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCourseId) params.append('courseId', selectedCourseId);
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.grade) params.append('grade', filters.grade);
      if (filters.phase) params.append('phase', filters.phase);
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      if (filters.search) params.append('search', filters.search);
      params.append('page', page.toString());
      params.append('limit', '20');

      const response = await fetch(`/api/v1/questions?${params.toString()}`);
      const data = await response.json();
      
      setQuestions(data.questions || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [filters.subject, filters.grade, filters.phase, filters.difficulty, selectedCourseId]);

  useEffect(() => {
    const loadTeacherCourses = async () => {
      try {
        const response = await fetch(`/api/v1/teacher/courses?locale=${locale}`, {
          headers: createUserHeaders(getStoredUserId()),
        });

        if (!response.ok) throw new Error('Failed to load teacher courses');

        const data = await response.json();
        const nextCourses = (data.courses || []).map((course: any) => ({
          id: course.id,
          title: course.title,
          gradeCode: course.gradeCode,
          subjectCode: course.subjectCode,
          subject: course.subject,
        }));

        setTeacherCourses(nextCourses);

        const requestedCourseId = searchParams.get('courseId');
        if (requestedCourseId && nextCourses.some((course: TeacherCourseOption) => course.id === requestedCourseId)) {
          setSelectedCourseId(requestedCourseId);
        }
      } catch (error) {
        console.error('Error loading teacher courses:', error);
      }
    };

    void loadTeacherCourses();
  }, [locale, searchParams]);

  useEffect(() => {
    if (!selectedCourseId) return;

    const selectedCourse = teacherCourses.find((course) => course.id === selectedCourseId);
    if (!selectedCourse) return;

    setFilters((prev) => ({
      ...prev,
      subject: selectedCourse.subjectCode,
      grade: selectedCourse.gradeCode,
    }));

    setPrintOptions((prev) => ({
      ...prev,
      title: prev.title === (isRTL ? 'برگه سوال' : 'Question Set') ? selectedCourse.title : prev.title,
      subtitle: `${selectedCourse.subject} • ${selectedCourse.gradeCode}`,
    }));
  }, [isRTL, selectedCourseId, teacherCourses]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadQuestions(1);
  };

  const toggleSelectQuestion = (id: string) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedQuestions(newSelected);
  };

  const selectAll = () => {
    const allIds = new Set(questions.map(q => q.id));
    setSelectedQuestions(allIds);
  };

  const deselectAll = () => {
    setSelectedQuestions(new Set());
  };

  const getSelectedQuestionData = () => questions.filter((q) => selectedQuestions.has(q.id));

  const openPrintableExport = () => {
    const selectedData = getSelectedQuestionData();
    if (selectedData.length === 0) return;

    if (!printOptions.title.trim()) {
      setPrintOptions((prev) => ({
        ...prev,
        title: isRTL ? 'برگه سوال' : 'Question Set',
      }));
    }

    setShowPrintDialog(true);
  };

  const handlePrintExport = () => {
    const selectedData = getSelectedQuestionData();
    if (selectedData.length === 0) return;

    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=960,height=1080');
    if (!printWindow) return;

    const answerKey = selectedData.map((question, index) => {
      const correctOption = question.options?.find((option) => option.isCorrect);
      return `
        <li>
          <strong>${isRTL ? 'سوال' : 'Question'} ${index + 1}:</strong>
          ${correctOption ? (isRTL ? correctOption.textFA || correctOption.text : correctOption.text) : '—'}
          ${printOptions.includeAnswerKey && (isRTL ? question.explanationFA || question.explanation : question.explanation || question.explanationFA)
            ? `<div class="answer-explanation">${isRTL ? question.explanationFA || question.explanation : question.explanation || question.explanationFA}</div>`
            : ''}
        </li>`;
    }).join('');

    const body = selectedData.map((question, index) => {
      const optionsMarkup = (question.options || []).map((option, optionIndex) => `
        <li>
          <span class="option-label">${String.fromCharCode(65 + optionIndex)}.</span>
          <span>${isRTL ? option.textFA || option.text : option.text}</span>
        </li>`).join('');

      return `
        <section class="question-card">
          <div class="question-number">${isRTL ? 'سوال' : 'Question'} ${index + 1}</div>
          <div class="question-stem">${isRTL ? question.stemFA || question.stem : question.stem}</div>
          <ul class="options-list">${optionsMarkup}</ul>
        </section>`;
    }).join('');

    const formatLabel = printOptions.format === 'exam'
      ? (isRTL ? 'آزمون' : 'Exam')
      : printOptions.format === 'practice'
        ? (isRTL ? 'تمرین' : 'Practice')
        : (isRTL ? 'کوییز' : 'Quiz');

    printWindow.document.write(`<!DOCTYPE html>
      <html lang="${locale}" dir="${isRTL ? 'rtl' : 'ltr'}">
        <head>
          <meta charset="utf-8" />
          <title>${printOptions.title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 32px; color: #111827; }
            .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 24px; }
            .header h1 { margin: 0; font-size: 28px; }
            .header p { margin: 8px 0 0; color: #4b5563; }
            .meta { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 12px; font-size: 13px; color: #374151; }
            .question-card { break-inside: avoid; border: 1px solid #e5e7eb; border-radius: 14px; padding: 18px; margin-bottom: 16px; }
            .question-number { font-weight: bold; color: #2563eb; margin-bottom: 8px; }
            .question-stem { font-size: 16px; line-height: 1.7; margin-bottom: 12px; }
            .options-list { list-style: none; padding: 0; margin: 0; }
            .options-list li { display: flex; gap: 8px; padding: 6px 0; }
            .option-label { min-width: 24px; font-weight: 600; }
            .answer-key { margin-top: 32px; border-top: 2px dashed #cbd5e1; padding-top: 20px; }
            .answer-key h2 { margin-bottom: 12px; }
            .answer-key li { margin-bottom: 10px; }
            .answer-explanation { margin-top: 6px; color: #4b5563; font-size: 13px; }
            @media print {
              body { margin: 18mm; }
              .question-card { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <header class="header">
            <h1>${printOptions.title}</h1>
            <p>${printOptions.subtitle || formatLabel}</p>
            <div class="meta">
              <span><strong>${isRTL ? 'نوع' : 'Format'}:</strong> ${formatLabel}</span>
              <span><strong>${isRTL ? 'تعداد سوال' : 'Questions'}:</strong> ${selectedData.length}</span>
              <span><strong>${isRTL ? 'تاریخ' : 'Date'}:</strong> ${new Date().toLocaleDateString(locale === 'fa' ? 'fa-IR' : 'en-US')}</span>
            </div>
          </header>
          ${body}
          ${printOptions.includeAnswerKey ? `<section class="answer-key"><h2>${isRTL ? 'کلید پاسخ' : 'Answer Key'}</h2><ol>${answerKey}</ol></section>` : ''}
        </body>
      </html>`);

    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'text-green-600 bg-green-50 dark:bg-green-950/20';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20';
      case 'HARD': return 'text-orange-600 bg-orange-50 dark:bg-orange-950/20';
      case 'EXPERT': return 'text-red-600 bg-red-50 dark:bg-red-950/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-950/20';
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case '5E_ENGAGE': return 'bg-purple-100 text-purple-700 dark:bg-purple-950/30';
      case '5E_EXPLORE': return 'bg-blue-100 text-blue-700 dark:bg-blue-950/30';
      case '5E_EXPLAIN': return 'bg-green-100 text-green-700 dark:bg-green-950/30';
      case '5E_ELABORATE': return 'bg-orange-100 text-orange-700 dark:bg-orange-950/30';
      case '5E_EVALUATE': return 'bg-red-100 text-red-700 dark:bg-red-950/30';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-950/30';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-lg sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link 
              href={`/${locale}/teacher`} 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Arrow className="h-5 w-5" />
              <span>{isRTL ? 'بازگشت' : 'Back'}</span>
            </Link>
            <h1 className="text-xl font-semibold">
              {isRTL ? 'بانک سوالات' : 'Question Bank'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {selectedQuestions.size > 0 && (
              <>
                <span className="text-sm text-muted-foreground">
                  {selectedQuestions.size} {isRTL ? 'انتخاب شده' : 'selected'}
                </span>
                <button
                  onClick={openPrintableExport}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
                >
                  <Printer className="h-4 w-4" />
                  {isRTL ? 'چاپ / PDF' : 'Print / PDF'}
                </button>
                <button
                  onClick={deselectAll}
                  className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-accent"
                >
                  <X className="h-4 w-4" />
                  {isRTL ? 'لغو انتخاب' : 'Deselect All'}
                </button>
              </>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-accent"
            >
              <Filter className="h-4 w-4" />
              {isRTL ? 'فیلترها' : 'Filters'}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Filters Sidebar */}
          {showFilters && (
            <aside className="space-y-4">
              <div className="rounded-2xl border bg-card p-4 sticky top-20">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  {isRTL ? 'فیلترها' : 'Filters'}
                </h3>

                {/* Search */}
                <form onSubmit={handleSearch} className="mb-4">
                  <label className="text-sm text-muted-foreground mb-2 block">
                    {isRTL ? 'جستجو' : 'Search'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      placeholder={isRTL ? 'جستجو در سوالات...' : 'Search questions...'}
                      className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-primary px-3 py-2 text-primary-foreground hover:bg-primary/90"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                  </div>
                </form>

                {/* Subject Filter */}
                <div className="mb-4">
                  <label className="text-sm text-muted-foreground mb-2 block">
                    {isRTL ? 'دوره' : 'Course'}
                  </label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">{isRTL ? 'همه دوره‌ها' : 'All Courses'}</option>
                    {teacherCourses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title} • {course.gradeCode}
                      </option>
                    ))}
                  </select>
                  {selectedCourseId ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {isRTL
                        ? 'فیلتر دوره باعث می‌شود فقط سوالات مرتبط با موضوع و پایه همین دوره نمایش داده شوند.'
                        : 'Course filtering narrows results to the subject and grade of that course.'}
                    </p>
                  ) : null}
                </div>

                {/* Subject Filter */}
                <div className="mb-4">
                  <label className="text-sm text-muted-foreground mb-2 block">
                    {isRTL ? 'موضوع' : 'Subject'}
                  </label>
                  <select
                    value={filters.subject}
                    onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">{isRTL ? 'همه موضوعات' : 'All Subjects'}</option>
                    {SUBJECTS.map(s => (
                      <option key={s.code} value={s.code}>
                        {isRTL ? s.nameFA : s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Grade Filter */}
                <div className="mb-4">
                  <label className="text-sm text-muted-foreground mb-2 block">
                    {isRTL ? 'پایه' : 'Grade'}
                  </label>
                  <select
                    value={filters.grade}
                    onChange={(e) => setFilters({ ...filters, grade: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">{isRTL ? 'همه پایه‌ها' : 'All Grades'}</option>
                    {GRADES.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                {/* Phase Filter */}
                <div className="mb-4">
                  <label className="text-sm text-muted-foreground mb-2 block">
                    {isRTL ? 'فاز ۵ت' : '5E Phase'}
                  </label>
                  <select
                    value={filters.phase}
                    onChange={(e) => setFilters({ ...filters, phase: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">{isRTL ? 'همه فازها' : 'All Phases'}</option>
                    {PHASES.map(p => (
                      <option key={p.code} value={p.code}>
                        {isRTL ? p.nameFA : p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Difficulty Filter */}
                <div className="mb-4">
                  <label className="text-sm text-muted-foreground mb-2 block">
                    {isRTL ? 'سختی' : 'Difficulty'}
                  </label>
                  <select
                    value={filters.difficulty}
                    onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">{isRTL ? 'همه سطوح' : 'All Levels'}</option>
                    {DIFFICULTIES.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Clear Filters */}
                <button
                  onClick={() => {
                    setSelectedCourseId('');
                    setFilters({ subject: '', grade: '', phase: '', difficulty: '', search: '' });
                  }}
                  className="w-full rounded-lg border px-4 py-2 text-sm hover:bg-accent"
                >
                  {isRTL ? 'پاک کردن فیلترها' : 'Clear Filters'}
                </button>
              </div>
            </aside>
          )}

          {/* Questions List */}
          <main>
            {/* Bulk Actions */}
            {questions.length > 0 && (
              <div className="mb-4 flex items-center justify-between rounded-lg border bg-card p-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={selectAll}
                    className="text-sm text-primary hover:underline"
                  >
                    {isRTL ? 'انتخاب همه' : 'Select All'}
                  </button>
                  {selectedQuestions.size > 0 && (
                    <button
                      onClick={deselectAll}
                      className="text-sm text-muted-foreground hover:underline"
                    >
                      {isRTL ? 'لغو انتخاب همه' : 'Deselect All'}
                    </button>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {pagination?.total || 0} {isRTL ? 'سوال' : 'questions'}
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="rounded-2xl border bg-card p-12 text-center">
                <div className="animate-spin mx-auto h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                <p className="mt-4 text-muted-foreground">
                  {isRTL ? 'در حال بارگذاری...' : 'Loading questions...'}
                </p>
              </div>
            )}

            {/* Empty State */}
            {!loading && questions.length === 0 && (
              <div className="rounded-2xl border bg-card p-12 text-center">
                <Search className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">
                  {isRTL ? 'سوالی یافت نشد' : 'No questions found'}
                </h3>
                <p className="mt-2 text-muted-foreground">
                  {isRTL ? 'فیلترهای خود را تغییر دهید یا سوال جدید ایجاد کنید' : 'Try adjusting your filters or create a new question'}
                </p>
              </div>
            )}

            {/* Questions Grid */}
            <div className="space-y-4">
              {questions.map((question) => (
                <div
                  key={question.id}
                  className="rounded-xl border bg-card p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleSelectQuestion(question.id)}
                      className="mt-1 text-muted-foreground hover:text-foreground"
                    >
                      {selectedQuestions.has(question.id) ? (
                        <CheckSquare className="h-5 w-5 text-primary" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>

                    {/* Question Content */}
                    <div className="flex-1">
                      {/* Meta Info */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="text-xs font-mono px-2 py-1 rounded bg-secondary">
                          {question.gradeLevel?.code || 'N/A'}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${getDifficultyColor(question.difficulty)}`}>
                          {question.difficulty}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${getPhaseColor(question.metadata?.phase5E)}`}>
                          {PHASES.find(p => p.code === question.metadata?.phase5E)?.[isRTL ? 'nameFA' : 'name'] || question.metadata?.phase5E}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {SUBJECTS.find(s => s.code === question.metadata?.subjectCode)?.[isRTL ? 'nameFA' : 'name']}
                        </span>
                      </div>

                      {/* Question Text */}
                      <p className="text-sm font-medium mb-2">
                        {isRTL ? question.stemFA : question.stem}
                      </p>

                      {/* Options Preview (for multiple choice) */}
                      {question.type === 'MULTIPLE_CHOICE' && question.options?.length > 0 && (
                        <div className="space-y-1 mb-3">
                          {question.options.slice(0, 2).map((option) => (
                            <div key={option.id} className="text-xs text-muted-foreground flex items-center gap-2">
                              <span className={option.isCorrect ? 'text-green-600' : ''}>
                                {option.isCorrect ? '✓' : '○'}
                              </span>
                              {isRTL ? option.textFA : option.text}
                            </div>
                          ))}
                          {question.options.length > 2 && (
                            <p className="text-xs text-muted-foreground">
                              +{question.options.length - 2} {isRTL ? 'گزینه دیگر' : 'more options'}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setPreviewQuestion(question)}
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <Eye className="h-3 w-3" />
                          {isRTL ? 'پیش‌نمایش' : 'Preview'}
                        </button>
                        <Link
                          href={`/${locale}/teacher/questions/${question.id}/edit`}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                        >
                          <Plus className="h-3 w-3 rotate-45" />
                          {isRTL ? 'ویرایش' : 'Edit'}
                        </Link>
                        <button
                          onClick={async () => {
                            if (confirm(isRTL ? 'آیا مطمئن هستید؟' : 'Are you sure?')) {
                              try {
                                const res = await fetch(`/api/v1/questions/${question.id}`, {
                                  method: 'DELETE'
                                });
                                if (res.ok) {
                                  loadQuestions(pagination?.page || 1);
                                }
                              } catch (error) {
                                console.error('Delete failed:', error);
                              }
                            }
                          }}
                          className="flex items-center gap-1 text-xs text-red-600 hover:underline"
                        >
                          <Trash2 className="h-3 w-3" />
                          {isRTL ? 'حذف' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => loadQuestions(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Arrow className="h-4 w-4" />
                  {isRTL ? 'قبلی' : 'Previous'}
                </button>

                <span className="text-sm text-muted-foreground">
                  {isRTL ? `صفحه ${pagination.page} از ${pagination.totalPages}` : `Page ${pagination.page} of ${pagination.totalPages}`}
                </span>

                <button
                  onClick={() => loadQuestions(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRTL ? 'بعدی' : 'Next'}
                  <Arrow className="h-4 w-4 rotate-180" />
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {showPrintDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="font-semibold">{isRTL ? 'ساخت خروجی قابل چاپ' : 'Create Printable Export'}</h3>
              <button onClick={() => setShowPrintDialog(false)} className="rounded-lg p-2 hover:bg-accent">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-muted-foreground">{isRTL ? 'نوع برگه' : 'Document Type'}</label>
                  <select
                    value={printOptions.format}
                    onChange={(e) => setPrintOptions((prev) => ({ ...prev, format: e.target.value as PrintExportOptions['format'] }))}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  >
                    <option value="quiz">{isRTL ? 'کوییز' : 'Quiz'}</option>
                    <option value="exam">{isRTL ? 'آزمون' : 'Exam'}</option>
                    <option value="practice">{isRTL ? 'تمرین' : 'Practice Set'}</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm text-muted-foreground">{isRTL ? 'زیرعنوان' : 'Subtitle'}</label>
                  <input
                    type="text"
                    value={printOptions.subtitle}
                    onChange={(e) => setPrintOptions((prev) => ({ ...prev, subtitle: e.target.value }))}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    placeholder={isRTL ? 'مثال: ریاضی • پایه پنجم' : 'e.g. Mathematics • Grade 5'}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-muted-foreground">{isRTL ? 'عنوان برگه' : 'Document Title'}</label>
                <input
                  type="text"
                  value={printOptions.title}
                  onChange={(e) => setPrintOptions((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                />
              </div>

              <label className="flex items-center gap-3 rounded-lg border p-3 text-sm">
                <input
                  type="checkbox"
                  checked={printOptions.includeAnswerKey}
                  onChange={(e) => setPrintOptions((prev) => ({ ...prev, includeAnswerKey: e.target.checked }))}
                />
                <span>{isRTL ? 'کلید پاسخ و توضیح‌ها اضافه شود' : 'Include answer key and explanations'}</span>
              </label>

              <div className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
                {isRTL
                  ? `این خروجی با قالب زیبا در پنجره چاپ باز می‌شود تا معلم بتواند آن را مستقیماً چاپ یا به PDF ذخیره کند. تعداد سوالات انتخاب‌شده: ${selectedQuestions.size}`
                  : `This export opens a polished print layout so the teacher can print it directly or save it as PDF. Selected questions: ${selectedQuestions.size}.`}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t p-4">
              <button onClick={() => setShowPrintDialog(false)} className="rounded-lg border px-4 py-2 hover:bg-accent">
                {isRTL ? 'انصراف' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  setShowPrintDialog(false);
                  handlePrintExport();
                }}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
              >
                <Printer className="h-4 w-4" />
                {isRTL ? 'باز کردن برای چاپ / PDF' : 'Open for Print / PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl bg-card border shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b bg-card p-4">
              <h3 className="font-semibold">{isRTL ? 'پیش‌نمایش سوال' : 'Question Preview'}</h3>
              <button
                onClick={() => setPreviewQuestion(null)}
                className="rounded-lg p-2 hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Question Stem */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {isRTL ? 'متن سوال' : 'Question'}
                </label>
                <p className="mt-2 text-lg">{isRTL ? previewQuestion.stemFA : previewQuestion.stem}</p>
              </div>

              {/* Options */}
              {previewQuestion.type === 'MULTIPLE_CHOICE' && previewQuestion.options && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {isRTL ? 'گزینه‌ها' : 'Options'}
                  </label>
                  <div className="mt-2 space-y-2">
                    {previewQuestion.options.map((option, index) => (
                      <div
                        key={option.id}
                        className={`rounded-lg border p-3 ${
                          option.isCorrect ? 'bg-green-50 border-green-200 dark:bg-green-950/20' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="font-medium">{String.fromCharCode(65 + index)}.</span>
                          <div className="flex-1">
                            <p>{isRTL ? option.textFA : option.text}</p>
                            {option.isCorrect && (
                              <p className="text-xs text-green-600 mt-1">✓ {isRTL ? 'پاسخ صحیح' : 'Correct Answer'}</p>
                            )}
                            {option.feedback && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {isRTL ? option.feedbackFA : option.feedback}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Explanation */}
              {previewQuestion.explanation && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {isRTL ? 'توضیحات' : 'Explanation'}
                  </label>
                  <p className="mt-2 text-sm">
                    {isRTL ? previewQuestion.explanationFA : previewQuestion.explanation}
                  </p>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <label className="text-xs text-muted-foreground">{isRTL ? 'سطح' : 'Difficulty'}</label>
                  <p className="text-sm font-medium">{previewQuestion.difficulty}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{isRTL ? 'سطح بلوم' : "Bloom's Level"}</label>
                  <p className="text-sm font-medium">{previewQuestion.bloomLevel}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{isRTL ? 'پایه' : 'Grade'}</label>
                  <p className="text-sm font-medium">{previewQuestion.gradeLevel?.name}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{isRTL ? 'فاز' : 'Phase'}</label>
                  <p className="text-sm font-medium">
                    {PHASES.find(p => p.code === previewQuestion.metadata?.phase5E)?.[isRTL ? 'nameFA' : 'name']}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
