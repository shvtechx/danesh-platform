'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, ArrowRight, Search, Filter, Download, 
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
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [showFilters, setShowFilters] = useState(true);

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
  }, [filters.subject, filters.grade, filters.phase, filters.difficulty]);

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

  const exportSelected = () => {
    const selectedData = questions.filter(q => selectedQuestions.has(q.id));
    const jsonString = JSON.stringify(selectedData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `questions-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
                  onClick={exportSelected}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
                >
                  <Download className="h-4 w-4" />
                  {isRTL ? 'دانلود' : 'Export'}
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
                  onClick={() => setFilters({ subject: '', grade: '', phase: '', difficulty: '', search: '' })}
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
