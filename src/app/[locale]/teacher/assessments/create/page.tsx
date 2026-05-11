'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { createUserHeaders, getStoredUserId } from '@/lib/auth/demo-auth-shared';
import {
  Plus,
  X,
  GripVertical,
  Clock,
  Target,
  Save,
  Eye,
  Search,
  Filter
} from 'lucide-react';

// Type definitions
interface Question {
  id: string;
  type: string;
  stem: string;
  stemFA: string | null;
  difficulty: string;
  bloomLevel: string;
  points: number;
  metadata: {
    phase5E?: string;
    subjectCode?: string;
  };
  gradeLevel: {
    code: string;
    name: string;
  };
  options?: QuestionOption[];
}

interface QuestionOption {
  id: string;
  text: string;
  textFA: string | null;
  isCorrect: boolean;
}

interface AssessmentQuestion {
  question: Question;
  sequence: number;
}

interface TeacherCourseOption {
  id: string;
  title: string;
  gradeCode: string;
  subjectCode: string;
  subject: string;
}

type FeedbackState = {
  variant: 'success' | 'error' | 'info';
  message: string;
} | null;

export default function CreateAssessmentPage() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRTL = locale === 'fa';

  // Assessment form data
  const [title, setTitle] = useState('');
  const [titleFA, setTitleFA] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'FORMATIVE' | 'SUMMATIVE'>('FORMATIVE');
  const [timeLimit, setTimeLimit] = useState<number | null>(null);
  const [passingScore, setPassingScore] = useState(70);

  // Question bank browsing
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<AssessmentQuestion[]>([]);
  const [showQuestionBrowser, setShowQuestionBrowser] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [savingAssessment, setSavingAssessment] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [teacherCourses, setTeacherCourses] = useState<TeacherCourseOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const previousCourseRef = useRef<TeacherCourseOption | null>(null);

  // Filters for question browser
  const [filters, setFilters] = useState({
    grade: '',
    phase: '',
    difficulty: '',
    search: ''
  });

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Load questions for browser
  useEffect(() => {
    if (showQuestionBrowser) {
      loadAvailableQuestions();
    }
  }, [showQuestionBrowser, filters, selectedCourseId]);

  useEffect(() => {
    const loadTeacherCourses = async () => {
      try {
        const res = await fetch(`/api/v1/teacher/courses?locale=${locale}`, {
          headers: createUserHeaders(getStoredUserId()),
        });

        if (!res.ok) throw new Error('Failed to load teacher courses');

        const data = await res.json();
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
    const selectedCourse = teacherCourses.find((course) => course.id === selectedCourseId);
    const previousCourse = previousCourseRef.current;

    if (!selectedCourseId || !selectedCourse) {
      if (previousCourse) {
        setFilters((prev) => ({
          ...prev,
          grade: prev.grade === previousCourse.gradeCode ? '' : prev.grade,
        }));
      }

      previousCourseRef.current = null;
      return;
    }

    previousCourseRef.current = selectedCourse;

    setFilters((prev) => ({
      ...prev,
      grade: selectedCourse.gradeCode,
    }));

    setTitle((prev) => prev || `${selectedCourse.title} ${isRTL ? 'ارزیابی' : 'Assessment'}`);
    setTitleFA((prev) => prev || (isRTL ? `${selectedCourse.title} - ارزیابی` : prev));
  }, [isRTL, selectedCourseId, teacherCourses]);

  const loadAvailableQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const params = new URLSearchParams();
      if (selectedCourseId) params.set('courseId', selectedCourseId);
      if (filters.grade) params.set('grade', filters.grade);
      if (filters.phase) params.set('phase', filters.phase);
      if (filters.difficulty) params.set('difficulty', filters.difficulty);
      if (filters.search) params.set('search', filters.search);
      params.set('limit', '50');

      const res = await fetch(`/api/v1/questions?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load questions');
      const data = await res.json();
      setAvailableQuestions(data.questions || []);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const addQuestion = (question: Question) => {
    // Check if already added
    if (selectedQuestions.some((q) => q.question.id === question.id)) {
      setFeedback({
        variant: 'info',
        message: isRTL ? 'این سوال قبلاً اضافه شده است' : 'Question already added',
      });
      return;
    }

    setFeedback(null);

    setSelectedQuestions([
      ...selectedQuestions,
      {
        question,
        sequence: selectedQuestions.length
      }
    ]);
  };

  const removeQuestion = (questionId: string) => {
    const filtered = selectedQuestions.filter((q) => q.question.id !== questionId);
    // Re-sequence
    const resequenced = filtered.map((q, index) => ({ ...q, sequence: index }));
    setSelectedQuestions(resequenced);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newQuestions = [...selectedQuestions];
    const draggedItem = newQuestions[draggedIndex];
    newQuestions.splice(draggedIndex, 1);
    newQuestions.splice(index, 0, draggedItem);

    // Re-sequence
    const resequenced = newQuestions.map((q, idx) => ({ ...q, sequence: idx }));
    setSelectedQuestions(resequenced);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const calculateTotalPoints = () => {
    return selectedQuestions.reduce((sum, q) => sum + q.question.points, 0);
  };

  const saveAssessment = async () => {
    if (!title.trim()) {
      setFeedback({
        variant: 'error',
        message: isRTL ? 'لطفاً عنوان ارزیابی را وارد کنید' : 'Please enter assessment title',
      });
      return;
    }

    if (selectedQuestions.length === 0) {
      setFeedback({
        variant: 'error',
        message: isRTL ? 'لطفاً حداقل یک سوال اضافه کنید' : 'Please add at least one question',
      });
      return;
    }

    try {
      setSavingAssessment(true);
      setFeedback(null);
      const res = await fetch('/api/v1/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          titleFA: titleFA || null,
          description: description || null,
          type,
          timeLimit,
          passingScore,
          questions: selectedQuestions.map((q) => ({
            questionId: q.question.id,
            sequence: q.sequence
          }))
        })
      });

      if (!res.ok) throw new Error('Failed to create assessment');

      await res.json();
      setFeedback({
        variant: 'success',
        message: isRTL ? 'ارزیابی با موفقیت ایجاد شد.' : 'Assessment created successfully.',
      });
      window.setTimeout(() => {
        router.push(`/${locale}/teacher/assessments`);
      }, 600);
    } catch (error) {
      console.error('Error creating assessment:', error);
      setFeedback({
        variant: 'error',
        message: isRTL ? 'خطا در ایجاد ارزیابی' : 'Error creating assessment',
      });
    } finally {
      setSavingAssessment(false);
    }
  };

  const handlePreviewAssessment = () => {
    setFeedback({
      variant: 'info',
      message: isRTL
        ? `پیش‌نمایش آماده است: ${selectedQuestions.length} سوال، ${calculateTotalPoints()} نمره و حد نصاب ${passingScore}٪.`
        : `Preview ready: ${selectedQuestions.length} questions, ${calculateTotalPoints()} points, passing score ${passingScore}%.`,
    });
  };

  const difficultyColors: Record<string, string> = {
    EASY: 'bg-green-100 text-green-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HARD: 'bg-orange-100 text-orange-800',
    EXPERT: 'bg-red-100 text-red-800'
  };

  const phaseColors: Record<string, string> = {
    '5E_ENGAGE': 'bg-purple-100 text-purple-800',
    '5E_EXPLORE': 'bg-blue-100 text-blue-800',
    '5E_EXPLAIN': 'bg-green-100 text-green-800',
    '5E_ELABORATE': 'bg-orange-100 text-orange-800',
    '5E_EVALUATE': 'bg-red-100 text-red-800'
  };

  const phaseNames: Record<string, { en: string; fa: string }> = {
    '5E_ENGAGE': { en: 'Engage', fa: 'تأثیر' },
    '5E_EXPLORE': { en: 'Explore', fa: 'تحقیق' },
    '5E_EXPLAIN': { en: 'Explain', fa: 'توضیح' },
    '5E_ELABORATE': { en: 'Elaborate', fa: 'تعمیم' },
    '5E_EVALUATE': { en: 'Evaluate', fa: 'تعیین' }
  };

  return (
    <div className="container mx-auto px-4 py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {isRTL ? 'ایجاد ارزیابی جدید' : 'Create New Assessment'}
        </h1>
        <p className="text-gray-600">
          {isRTL
            ? 'سوالات را از بانک سوالات انتخاب کرده و ارزیابی خود را بسازید'
            : 'Select questions from the question bank to build your assessment'}
        </p>
      </div>

      {feedback ? (
        <FeedbackBanner className="mb-6" variant={feedback.variant} message={feedback.message} />
      ) : null}

      <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
        {/* Main Content - Assessment Builder */}
        <div className="space-y-6">
          {/* Basic Info Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              {isRTL ? 'اطلاعات پایه' : 'Basic Information'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {isRTL ? 'دوره مرتبط' : 'Course Context'}
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">{isRTL ? 'بدون دوره مشخص' : 'No specific course'}</option>
                  {teacherCourses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title} • {course.subjectCode} • {course.gradeCode}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {isRTL
                    ? 'با انتخاب دوره، بانک سوالات به‌صورت خودکار به سوالات مرتبط با موضوع و پایه همان دوره محدود می‌شود.'
                    : 'Selecting a course automatically narrows the question bank to that course’s subject and grade.'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {isRTL ? 'عنوان (انگلیسی)' : 'Title (English)'}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder={isRTL ? 'مثال: Algebra Quiz 1' : 'e.g., Algebra Quiz 1'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {isRTL ? 'عنوان (فارسی)' : 'Title (Persian)'}
                </label>
                <input
                  type="text"
                  value={titleFA}
                  onChange={(e) => setTitleFA(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder={isRTL ? 'آزمون جبر ۱' : 'e.g., آزمون جبر ۱'}
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {isRTL ? 'توضیحات' : 'Description'}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                  placeholder={isRTL ? 'توضیحات اضافی...' : 'Optional description...'}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {isRTL ? 'نوع' : 'Type'}
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'FORMATIVE' | 'SUMMATIVE')}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="FORMATIVE">
                      {isRTL ? 'تکوینی (تمرین)' : 'Formative (Practice)'}
                    </option>
                    <option value="SUMMATIVE">
                      {isRTL ? 'تراکمی (نمره‌دار)' : 'Summative (Graded)'}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    <Clock className="inline w-4 h-4 mr-1" />
                    {isRTL ? 'مدت زمان (دقیقه)' : 'Time Limit (min)'}
                  </label>
                  <input
                    type="number"
                    value={timeLimit || ''}
                    onChange={(e) => setTimeLimit(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full border rounded px-3 py-2"
                    placeholder={isRTL ? 'بدون محدودیت' : 'No limit'}
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    <Target className="inline w-4 h-4 mr-1" />
                    {isRTL ? 'نمره قبولی (%)' : 'Passing Score (%)'}
                  </label>
                  <input
                    type="number"
                    value={passingScore}
                    onChange={(e) => setPassingScore(parseInt(e.target.value))}
                    className="w-full border rounded px-3 py-2"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Selected Questions */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {isRTL ? 'سوالات انتخاب شده' : 'Selected Questions'} ({selectedQuestions.length})
              </h2>
              <button
                onClick={() => setShowQuestionBrowser(!showQuestionBrowser)}
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                <Plus className="w-4 h-4" />
                {isRTL ? 'افزودن سوال' : 'Add Question'}
              </button>
            </div>

            {selectedQuestions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>{isRTL ? 'هنوز سوالی اضافه نشده است' : 'No questions added yet'}</p>
                <p className="text-sm">
                  {isRTL
                    ? 'روی دکمه "افزودن سوال" کلیک کنید'
                    : 'Click "Add Question" to browse the question bank'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedQuestions.map((aq, index) => (
                  <div
                    key={aq.question.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`border rounded p-4 cursor-move hover:shadow-md transition-shadow ${
                      draggedIndex === index ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <GripVertical className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <span className="font-medium text-gray-700">Q{index + 1}.</span>{' '}
                            <span>{isRTL && aq.question.stemFA ? aq.question.stemFA : aq.question.stem}</span>
                          </div>
                          <button
                            onClick={() => removeQuestion(aq.question.id)}
                            className="text-red-500 hover:text-red-700 flex-shrink-0"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className={`text-xs px-2 py-1 rounded ${difficultyColors[aq.question.difficulty]}`}>
                            {aq.question.difficulty}
                          </span>
                          <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800">
                            {aq.question.gradeLevel.code}
                          </span>
                          {aq.question.metadata.phase5E && (
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                phaseColors[aq.question.metadata.phase5E]
                              }`}
                            >
                              {isRTL
                                ? phaseNames[aq.question.metadata.phase5E]?.fa
                                : phaseNames[aq.question.metadata.phase5E]?.en}
                            </span>
                          )}
                          <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                            {aq.question.points} {isRTL ? 'نمره' : 'pts'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Summary and Actions */}
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-white rounded-lg shadow p-6 sticky top-20">
            <h3 className="text-lg font-semibold mb-4">
              {isRTL ? 'خلاصه' : 'Summary'}
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{isRTL ? 'تعداد سوالات:' : 'Questions:'}</span>
                <span className="font-semibold">{selectedQuestions.length}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">{isRTL ? 'مجموع نمرات:' : 'Total Points:'}</span>
                <span className="font-semibold">{calculateTotalPoints()}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">{isRTL ? 'نوع:' : 'Type:'}</span>
                <span className="font-semibold">
                  {type === 'FORMATIVE'
                    ? isRTL
                      ? 'تکوینی'
                      : 'Formative'
                    : isRTL
                    ? 'تراکمی'
                    : 'Summative'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">{isRTL ? 'مدت زمان:' : 'Time Limit:'}</span>
                <span className="font-semibold">
                  {timeLimit ? `${timeLimit} ${isRTL ? 'دقیقه' : 'min'}` : isRTL ? 'نامحدود' : 'Unlimited'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">{isRTL ? 'نمره قبولی:' : 'Passing:'}</span>
                <span className="font-semibold">{passingScore}%</span>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <button
                onClick={saveAssessment}
                className="w-full flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                <Save className="w-4 h-4" />
                {isRTL ? 'ذخیره ارزیابی' : 'Save Assessment'}
              </button>

              <button
                type="button"
                onClick={handlePreviewAssessment}
                className="w-full flex items-center justify-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
              >
                <Eye className="w-4 h-4" />
                {isRTL ? 'پیش‌نمایش' : 'Preview'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Question Browser Modal */}
      {showQuestionBrowser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {isRTL ? 'بانک سوالات' : 'Question Bank'}
              </h2>
              <button
                onClick={() => setShowQuestionBrowser(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Filters */}
            <div className="p-4 border-b bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="border rounded px-3 py-2 text-sm"
                >
                  <option value="">{isRTL ? 'همه دوره‌ها' : 'All Courses'}</option>
                  {teacherCourses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title} • {course.gradeCode}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder={isRTL ? 'جستجو...' : 'Search...'}
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="border rounded px-3 py-2 text-sm"
                />
                <select
                  value={filters.grade}
                  onChange={(e) => setFilters({ ...filters, grade: e.target.value })}
                  disabled={Boolean(selectedCourseId)}
                  className="border rounded px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">{isRTL ? 'همه پایه‌ها' : 'All Grades'}</option>
                  <option value="KG">KG</option>
                  <option value="G1">G1</option>
                  <option value="G2">G2</option>
                  <option value="G3">G3</option>
                  <option value="G4">G4</option>
                  <option value="G5">G5</option>
                  <option value="G6">G6</option>
                  <option value="G7">G7</option>
                  <option value="G8">G8</option>
                  <option value="G9">G9</option>
                  <option value="G10">G10</option>
                  <option value="G11">G11</option>
                  <option value="G12">G12</option>
                </select>
                <select
                  value={filters.difficulty}
                  onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                  className="border rounded px-3 py-2 text-sm"
                >
                  <option value="">{isRTL ? 'همه سطوح' : 'All Difficulties'}</option>
                  <option value="EASY">{isRTL ? 'آسان' : 'Easy'}</option>
                  <option value="MEDIUM">{isRTL ? 'متوسط' : 'Medium'}</option>
                  <option value="HARD">{isRTL ? 'سخت' : 'Hard'}</option>
                  <option value="EXPERT">{isRTL ? 'خبره' : 'Expert'}</option>
                </select>
                <select
                  value={filters.phase}
                  onChange={(e) => setFilters({ ...filters, phase: e.target.value })}
                  className="border rounded px-3 py-2 text-sm"
                >
                  <option value="">{isRTL ? 'همه فازها' : 'All Phases'}</option>
                  <option value="5E_ENGAGE">{isRTL ? 'تأثیر' : 'Engage'}</option>
                  <option value="5E_EXPLORE">{isRTL ? 'تحقیق' : 'Explore'}</option>
                  <option value="5E_EXPLAIN">{isRTL ? 'توضیح' : 'Explain'}</option>
                  <option value="5E_ELABORATE">{isRTL ? 'تعمیم' : 'Elaborate'}</option>
                  <option value="5E_EVALUATE">{isRTL ? 'تعیین' : 'Evaluate'}</option>
                </select>
              </div>
              {selectedCourseId ? (
                <p className="mt-3 text-xs text-gray-500">
                  {isRTL
                    ? 'فهرست سوالات بر اساس دوره انتخاب‌شده به شکل خودکار محدود شده است.'
                    : 'The list is automatically narrowed to the selected course context.'}
                </p>
              ) : null}
            </div>

            {/* Questions List */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingQuestions ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-gray-600">{isRTL ? 'در حال بارگذاری...' : 'Loading...'}</p>
                </div>
              ) : availableQuestions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>{isRTL ? 'سوالی یافت نشد' : 'No questions found'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableQuestions.map((q) => (
                    <div key={q.id} className="border rounded p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="mb-2">{isRTL && q.stemFA ? q.stemFA : q.stem}</p>
                          <div className="flex flex-wrap gap-2">
                            <span className={`text-xs px-2 py-1 rounded ${difficultyColors[q.difficulty]}`}>
                              {q.difficulty}
                            </span>
                            <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800">
                              {q.gradeLevel.code}
                            </span>
                            {q.metadata.phase5E && (
                              <span className={`text-xs px-2 py-1 rounded ${phaseColors[q.metadata.phase5E]}`}>
                                {isRTL ? phaseNames[q.metadata.phase5E]?.fa : phaseNames[q.metadata.phase5E]?.en}
                              </span>
                            )}
                            <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                              {q.points} {isRTL ? 'نمره' : 'pts'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => addQuestion(q)}
                          className="flex-shrink-0 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
