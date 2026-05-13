'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { createUserHeaders, getStoredUserId } from '@/lib/auth/demo-auth-shared';
import { extractSafeEmbedConfig, normalizeExternalEmbedUrl } from '@/lib/content/embed-utils';
import {
  Play,
  CheckCircle,
  Circle,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Lightbulb,
  Search,
  PenTool,
  Target,
  Clock,
  Award,
  ChevronRight,
  Home,
  FileText,
  Video,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';

// 5E Phase definitions
const PHASES = {
  ENGAGE: {
    icon: Lightbulb,
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    accent: 'bg-purple-500',
    name: { en: 'Engage', fa: 'تأثیر' },
    description: {
      en: 'Hook your curiosity and activate prior knowledge',
      fa: 'جلب کنجکاوی و فعال‌سازی دانش قبلی'
    }
  },
  EXPLORE: {
    icon: Search,
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    accent: 'bg-blue-500',
    name: { en: 'Explore', fa: 'تحقیق' },
    description: {
      en: 'Investigate and discover through hands-on activities',
      fa: 'تحقیق و کشف از طریق فعالیت‌های عملی'
    }
  },
  EXPLAIN: {
    icon: BookOpen,
    badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    accent: 'bg-green-500',
    name: { en: 'Explain', fa: 'توضیح' },
    description: {
      en: 'Learn concepts through clear explanations',
      fa: 'یادگیری مفاهیم از طریق توضیحات واضح'
    }
  },
  ELABORATE: {
    icon: PenTool,
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    accent: 'bg-orange-500',
    name: { en: 'Elaborate', fa: 'تعمیم' },
    description: {
      en: 'Apply and extend your understanding',
      fa: 'کاربرد و گسترش درک شما'
    }
  },
  EVALUATE: {
    icon: Target,
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    accent: 'bg-red-500',
    name: { en: 'Evaluate', fa: 'تعیین' },
    description: {
      en: 'Demonstrate mastery through assessment',
      fa: 'نشان دادن تسلط از طریق ارزیابی'
    }
  }
};

interface ContentItem {
  id: string;
  type: string;
  title: string;
  titleFA: string | null;
  body: string | null;
  bodyFA: string | null;
  metadata: any;
}

interface LessonContent {
  id: string;
  sequence: number;
  contentItem: ContentItem;
}

interface LessonAssessment {
  id: string;
  sequence: number;
  assessment: {
    id: string;
    title: string;
    titleFA: string | null;
    type: string;
    timeLimit: number | null;
    questions: any[];
  };
}

interface Lesson {
  id: string;
  title: string;
  titleFA: string | null;
  phase: keyof typeof PHASES;
  estimatedTime: number | null;
  unit: {
    id: string;
    title: string;
    course: {
      id: string;
      title: string;
    };
  };
  contentItems: LessonContent[];
  assessments: LessonAssessment[];
}

interface LessonCompletion {
  id: string;
  startedAt: string;
  completedAt: string | null;
  timeSpent: number | null;
  masteryScore: number | null;
}

export default function LearnLessonPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const isRTL = locale === 'fa';
  const lessonId = params.id as string;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [completion, setCompletion] = useState<LessonCompletion | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [startTime] = useState(Date.now());
  const [itemCompletions, setItemCompletions] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<{ variant: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    loadLesson();
    loadCompletion();
  }, [lessonId]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (completion && !completion.completedAt) saveProgress();
    }, 30000);
    return () => clearInterval(interval);
  }, [completion, currentIndex]);

  const loadLesson = async () => {
    try {
      const res = await fetch(`/api/v1/lessons/${lessonId}`);
      if (!res.ok) throw new Error('Failed to load lesson');
      const data = await res.json();
      setLesson(data.lesson);
    } catch (error) {
      console.error('Error loading lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompletion = async () => {
    try {
      const headers = createUserHeaders(getStoredUserId());
      const res = await fetch(`/api/v1/lessons/${lessonId}/completion`, { headers });
      if (res.ok) {
        const data = await res.json();
        setCompletion(data.completion);
      } else {
        const createRes = await fetch(`/api/v1/lessons/${lessonId}/completion`, { method: 'POST', headers });
        if (createRes.ok) {
          const data = await createRes.json();
          setCompletion(data.completion);
        }
      }
    } catch (error) {
      console.error('Error loading completion:', error);
    }
  };

  const saveProgress = async () => {
    if (!completion) return;
    const timeSpent = Math.floor((Date.now() - new Date(completion.startedAt).getTime()) / 1000);
    try {
      await fetch(`/api/v1/lessons/${lessonId}/completion`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...createUserHeaders(getStoredUserId()) },
        body: JSON.stringify({ timeSpent, currentIndex }),
      });
    } catch {}
  };

  const markItemComplete = (itemId: string) => {
    setItemCompletions((prev) => new Set(prev).add(itemId));
  };

  const handleNext = () => {
    if (!lesson) return;
    const totalItems = lesson.contentItems.length + lesson.assessments.length;
    if (currentIndex < totalItems - 1) {
      setCurrentIndex((prev) => prev + 1);
      saveProgress();
    } else if (!completion?.completedAt) {
      completeLesson();
    } else {
      router.push(`/${locale}/dashboard`);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      saveProgress();
    }
  };

  const completeLesson = async () => {
    if (!completion) return;
    if (completion.completedAt) { router.push(`/${locale}/dashboard`); return; }
    const timeSpent = Math.floor((Date.now() - new Date(completion.startedAt).getTime()) / 1000);
    try {
      const res = await fetch(`/api/v1/lessons/${lessonId}/completion`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...createUserHeaders(getStoredUserId()) },
        body: JSON.stringify({ completedAt: new Date().toISOString(), timeSpent, masteryScore: 100 }),
      });
      if (res.ok) {
        setFeedback({ variant: 'success', message: isRTL ? '🎉 تبریک! درس را به پایان رساندید.' : '🎉 Congratulations! You completed the lesson.' });
        setTimeout(() => router.push(`/${locale}/dashboard`), 2000);
      }
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
        <BookOpen className="h-16 w-16 text-muted-foreground/40" />
        <p className="text-xl font-semibold text-muted-foreground">
          {isRTL ? 'درس یافت نشد' : 'Lesson not found'}
        </p>
        <Link href={`/${locale}/dashboard`} className="rounded-xl border px-5 py-2.5 text-sm hover:bg-muted">
          {isRTL ? 'بازگشت به داشبورد' : 'Back to Dashboard'}
        </Link>
      </div>
    );
  }

  const phaseInfo = PHASES[lesson.phase] ?? PHASES.EXPLAIN;
  const PhaseIcon = phaseInfo.icon;
  const totalItems = lesson.contentItems.length + lesson.assessments.length;
  const progress = totalItems > 0 ? ((currentIndex + 1) / totalItems) * 100 : 0;

  const allItems = [
    ...lesson.contentItems.map((lc) => ({ type: 'content', data: lc })),
    ...lesson.assessments.map((la) => ({ type: 'assessment', data: la })),
  ].sort((a, b) => (a.data as any).sequence - (b.data as any).sequence);

  const currentItem = allItems[currentIndex];
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const PrevArrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ── Sticky Navigation Header ── */}
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-3 px-4">
          {/* Home & Back */}
          <Link
            href={`/${locale}/dashboard`}
            className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">{isRTL ? 'خانه' : 'Home'}</span>
          </Link>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40" />

          {/* Breadcrumb */}
          <Link
            href={`/${locale}/dashboard`}
            className="truncate text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
          >
            {lesson.unit.course.title}
          </Link>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 hidden sm:block" />
          <span className="truncate text-sm font-medium text-foreground">
            {isRTL && lesson.titleFA ? lesson.titleFA : lesson.title}
          </span>

          <div className="flex-1" />

          {/* Phase badge */}
          <span className={`hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${phaseInfo.badge}`}>
            <PhaseIcon className="h-3.5 w-3.5" />
            {isRTL ? phaseInfo.name.fa : phaseInfo.name.en}
          </span>

          {/* Estimated time */}
          {lesson.estimatedTime && (
            <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {lesson.estimatedTime} {isRTL ? 'دقیقه' : 'min'}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className={`h-full ${phaseInfo.accent} transition-all duration-500`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
        {feedback && (
          <FeedbackBanner className="mb-6" variant={feedback.variant} message={feedback.message} />
        )}

        {/* Lesson header card */}
        <div className="mb-6 rounded-2xl border bg-card p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">
                {isRTL && lesson.titleFA ? lesson.titleFA : lesson.title}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {isRTL ? phaseInfo.description.fa : phaseInfo.description.en}
              </p>
            </div>
            <div className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium sm:hidden ${phaseInfo.badge}`}>
              <PhaseIcon className="h-3.5 w-3.5" />
              {isRTL ? phaseInfo.name.fa : phaseInfo.name.en}
            </div>
          </div>

          {/* Progress info */}
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>{isRTL ? `${currentIndex + 1} از ${totalItems} بخش` : `${currentIndex + 1} of ${totalItems} sections`}</span>
            <span className="font-medium text-foreground">{Math.round(progress)}%</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${phaseInfo.accent} transition-all duration-500`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Content card */}
        <div className="rounded-2xl border bg-card p-6 sm:p-8 shadow-sm">
          {currentItem?.type === 'content' && (
            <ContentRenderer
              content={(currentItem.data as LessonContent).contentItem}
              isRTL={isRTL}
              onComplete={() => markItemComplete((currentItem.data as LessonContent).contentItem.id)}
              isCompleted={itemCompletions.has((currentItem.data as LessonContent).contentItem.id)}
              onNotify={(message, variant = 'info') => setFeedback({ message, variant })}
            />
          )}

          {currentItem?.type === 'assessment' && (
            <AssessmentRenderer
              assessment={(currentItem.data as LessonAssessment).assessment}
              isRTL={isRTL}
              onComplete={() => markItemComplete((currentItem.data as LessonAssessment).assessment.id)}
              onNotify={(message, variant = 'info') => setFeedback({ message, variant })}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between gap-4">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 rounded-xl border bg-card px-5 py-2.5 text-sm font-medium shadow-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <PrevArrow className="h-4 w-4" />
            {isRTL ? 'قبلی' : 'Previous'}
          </button>

          {/* Dots */}
          {totalItems <= 10 && (
            <div className="flex gap-1.5">
              {allItems.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-2 rounded-full transition-all ${i === currentIndex ? `w-6 ${phaseInfo.accent}` : 'w-2 bg-muted-foreground/25 hover:bg-muted-foreground/50'}`}
                />
              ))}
            </div>
          )}

          <button
            onClick={handleNext}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 ${phaseInfo.accent}`}
          >
            {currentIndex < totalItems - 1 ? (
              <>
                {isRTL ? 'بعدی' : 'Next'}
                <Arrow className="h-4 w-4" />
              </>
            ) : (
              <>
                {isRTL ? 'اتمام درس' : 'Complete Lesson'}
                <CheckCircle className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}

// Content Renderer Component
function ContentRenderer({
  content,
  isRTL,
  onComplete,
  isCompleted,
  onNotify,
}: {
  content: ContentItem;
  isRTL: boolean;
  onComplete: () => void;
  isCompleted: boolean;
  onNotify: (message: string, variant?: 'success' | 'error' | 'info') => void;
}) {
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    // Mark as completed after 5 seconds of viewing
    const timer = setTimeout(() => {
      setHasInteracted(true);
      onComplete();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const title = isRTL && content.titleFA ? content.titleFA : content.title;
  const body = isRTL && content.bodyFA ? content.bodyFA : content.body;

  // Simple markdown-to-html renderer for TEXT content
  const markdownToHtml = (md: string): string => {
    if (!md) return '';
    return md
      .replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold mt-4 mb-2">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold mt-5 mb-2">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold mt-6 mb-3">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code class="bg-gray-100 rounded px-1">$1</code>')
      .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')
      .replace(/\n\n/g, '</p><p class="mb-3">')
      .replace(/^(?!<[hlip])(.+)$/gm, '<p class="mb-3">$1</p>');
  };

  // Detect if content type is video (by ContentType field OR modality in metadata)
  const isVideoContent = content.type === 'VIDEO' ||
    (content as any).modality === 'VIDEO' ||
    (content.metadata as any)?.url;

  const isSimulationContent = content.type === 'SIMULATION';
  const rawImageUrl =
    typeof (content.metadata as any)?.imageUrl === 'string'
      ? (content.metadata as any).imageUrl
      : content.type === 'IMAGE'
        ? body
        : null;
  const imageUrl = rawImageUrl?.trim() || null;
  const isImageContent = Boolean(imageUrl);
  const imageCaption =
    typeof (content.metadata as any)?.caption === 'string' && (content.metadata as any).caption.trim()
      ? (content.metadata as any).caption.trim()
      : null;

  const rawVideoUrl = (content.metadata as any)?.url || (isVideoContent ? body : null);
  const embedUrl = rawVideoUrl ? normalizeExternalEmbedUrl(rawVideoUrl) : null;
  const simulationEmbed = isSimulationContent
    ? extractSafeEmbedConfig(((content.metadata as any)?.embedUrl as string) || body || '')
    : null;

  return (
    <div>
      {/* Title */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
        {isCompleted && (
          <CheckCircle className="w-8 h-8 text-green-500" />
        )}
      </div>

      {/* Video content */}
      {embedUrl && (
        <div className="aspect-video bg-black rounded-lg overflow-hidden mb-6 shadow-lg">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            title={title}
          />
        </div>
      )}

      {content.type === 'INTERACTIVE' && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-8 mb-4 border-2 border-purple-200">
          <div className="text-center mb-6">
            <div className="inline-block p-4 bg-purple-100 rounded-full mb-4">
              <Play className="w-12 h-12 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {isRTL ? 'فعالیت تعاملی' : 'Interactive Activity'}
            </h3>
            <p className="text-gray-600">
              {isRTL
                ? 'این یک فعالیت تعاملی است که به شما کمک می‌کند مفاهیم را عملی کنید'
                : 'This is an interactive activity to help you apply the concepts'}
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-inner">
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    onComplete();
                    onNotify(isRTL ? `شما مربع ${num} را انتخاب کردید!` : `You selected box ${num}!`, 'info');
                  }}
                  className="aspect-square bg-gradient-to-br from-blue-400 to-purple-500 text-white font-bold text-2xl rounded-lg hover:scale-105 transition-transform shadow-lg"
                >
                  {num}
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-gray-600">
              {isRTL ? 'روی هر مربع کلیک کنید تا آن را کاوش کنید' : 'Click on any box to explore it'}
            </p>
          </div>
        </div>
      )}

      {isSimulationContent && (
        <div className="mb-6 rounded-2xl border bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{isRTL ? 'شبیه‌سازی تعاملی' : 'Interactive simulation'}</h3>
              <p className="text-sm text-gray-600">
                {isRTL
                  ? 'با این شبیه‌ساز مفهوم را به‌صورت تعاملی بررسی کنید و سپس نتیجه را به مسئله‌های درس وصل کنید.'
                  : 'Use this simulation to explore the concept actively, then connect what you notice to the lesson problems.'}
              </p>
            </div>
            {simulationEmbed?.embedUrl ? (
              <a
                href={normalizeExternalEmbedUrl(simulationEmbed.embedUrl)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-primary hover:bg-muted"
              >
                {isRTL ? 'باز کردن در پنجره جدید' : 'Open in new tab'}
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : null}
          </div>

          {simulationEmbed?.embedUrl ? (
            <div className="aspect-video overflow-hidden rounded-xl border bg-background shadow-sm">
              <iframe
                src={simulationEmbed.embedUrl}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                loading="lazy"
                title={title}
              />
            </div>
          ) : (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
              {isRTL
                ? 'این شبیه‌سازی در حال حاضر لینک قابل‌جاسازی معتبری ندارد.'
                : 'This simulation does not currently have a valid embeddable link.'}
            </div>
          )}
        </div>
      )}

      {isImageContent && imageUrl ? (
        <figure className="mb-6 overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="bg-muted/30 p-3 sm:p-4">
            <img src={imageUrl} alt={title} className="max-h-[32rem] w-full rounded-xl object-contain" loading="lazy" />
          </div>
          {imageCaption ? <figcaption className="px-4 pb-4 text-sm text-muted-foreground">{imageCaption}</figcaption> : null}
        </figure>
      ) : null}

      {/* Text / body content - render as markdown */}
      {body && !isVideoContent && !isSimulationContent && !isImageContent && (
        <div className="prose max-w-none">
          <div
            dangerouslySetInnerHTML={{ __html: markdownToHtml(body) }}
            className="text-gray-700 leading-relaxed"
          />
        </div>
      )}

      {!hasInteracted && (
        <div className="mt-6 text-center text-sm text-gray-500">
          {isRTL ? '⏳ در حال بارگذاری محتوا...' : '⏳ Content will be marked as complete after 5 seconds...'}
        </div>
      )}
    </div>
  );
}

// Assessment Renderer Component
function AssessmentRenderer({
  assessment,
  isRTL,
  onComplete,
  onNotify,
}: {
  assessment: any;
  isRTL: boolean;
  onComplete: () => void;
  onNotify: (message: string, variant?: 'success' | 'error' | 'info') => void;
}) {
  const normalizedQuestions = (assessment.questions || []).map((item: any, index: number) => {
    const question = item.question || item;
    return {
      ...question,
      sequence: item.sequence ?? index,
      options: question.options || [],
    };
  });

  const [timeRemaining, setTimeRemaining] = useState(assessment.timeLimit ? assessment.timeLimit * 60 : null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submissionResult, setSubmissionResult] = useState<{
    hasPendingReview: boolean;
    percentage: number | null;
    autoGradedScore: number;
    maxScore: number;
  } | null>(null);

  const currentQuestion = normalizedQuestions[currentQuestionIndex];

  const startAttempt = async () => {
    try {
      const userId = getStoredUserId();
      const response = await fetch(`/api/v1/assessments/${assessment.id}/start`, {
        method: 'POST',
        headers: createUserHeaders(userId),
      });

      if (!response.ok) {
        throw new Error('Failed to start assessment');
      }

      const data = await response.json();
      setAttemptId(data.attemptId || null);

      if (Array.isArray(data.savedAnswers)) {
        const restored = Object.fromEntries(
          data.savedAnswers.map((answer: any) => {
            const responseValue = answer.response && typeof answer.response === 'object'
              ? (answer.response.value ?? answer.response)
              : answer.response;
            return [answer.questionId, responseValue];
          }),
        );
        setAnswers(restored);
      }
    } catch (error) {
      console.error('Error starting assessment:', error);
      onNotify(isRTL ? 'شروع ارزیابی ممکن نبود.' : 'Could not start the assessment.', 'error');
    }
  };

  useEffect(() => {
    void startAttempt();
  }, [assessment.id]);

  const handleSubmit = async () => {
    if (!attemptId || submitting) {
      return;
    }

    try {
      setSubmitting(true);

      const payload = normalizedQuestions.map((question: any) => ({
        questionId: question.id,
        response: answers[question.id] ?? null,
      }));

      const response = await fetch(`/api/v1/attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...createUserHeaders(getStoredUserId()),
        },
        body: JSON.stringify({ answers: payload }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit assessment');
      }

      const result = await response.json();
      setSubmissionResult({
        hasPendingReview: Boolean(result.hasPendingReview),
        percentage: result.percentage,
        autoGradedScore: result.autoGradedScore || 0,
        maxScore: result.maxScore || 0,
      });
      setSubmitted(true);
      onComplete();
      onNotify(
        result.hasPendingReview
          ? (isRTL ? 'بخش‌های تشریحی برای بررسی معلم ارسال شد.' : 'Written responses were sent for teacher review.')
          : (isRTL ? 'ارزیابی با موفقیت ارسال شد.' : 'Assessment submitted successfully.'),
        'success',
      );
    } catch (error) {
      console.error('Error submitting assessment:', error);
      onNotify(isRTL ? 'ارسال ارزیابی ممکن نبود.' : 'Could not submit the assessment.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!timeRemaining || submitted) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev && prev <= 1) {
          void handleSubmit();
          return 0;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [submitted, timeRemaining, attemptId, answers]);

  const updateAnswer = (questionId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const title = isRTL && assessment.titleFA ? assessment.titleFA : assessment.title;

  return (
    <div>
      {/* Assessment Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
          <div className="flex items-center gap-4">
            <span className="inline-block bg-red-100 text-red-800 text-sm px-3 py-1 rounded-full">
              {assessment.type === 'FORMATIVE' 
                ? (isRTL ? 'تکوینی' : 'Formative')
                : (isRTL ? 'تراکمی' : 'Summative')}
            </span>
            {assessment.questions && (
              <span className="text-gray-600">
                {assessment.questions.length} {isRTL ? 'سوال' : 'questions'}
              </span>
            )}
          </div>
        </div>

        {timeRemaining !== null && !submitted && (
          <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-lg">
            <Clock className="w-5 h-5 text-red-500" />
            <span className="text-lg font-bold text-red-700">
              {formatTime(timeRemaining)}
            </span>
          </div>
        )}
      </div>

      {/* Assessment Content */}
      {!submitted ? (
        <div>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <p className="text-yellow-700">
              {isRTL
                ? 'این ارزیابی با سوالات چندگزینه‌ای و تشریحی، میزان تسلط و کیفیت استدلال شما را می‌سنجد.'
                : 'This assessment combines selected-response and written-response questions to measure mastery and the quality of your reasoning.'}
            </p>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {normalizedQuestions.map((question: any, index: number) => {
              const answered = answers[question.id] !== undefined && answers[question.id] !== null && answers[question.id] !== '';
              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`rounded-full px-3 py-1.5 text-sm transition ${
                    currentQuestionIndex === index
                      ? 'bg-primary text-primary-foreground'
                      : answered
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isRTL ? `سوال ${index + 1}` : `Q${index + 1}`}
                </button>
              );
            })}
          </div>

          <div className="space-y-6">
            {currentQuestion ? (
              <div className="border rounded-lg p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <p className="font-medium">
                    {isRTL ? `سوال ${currentQuestionIndex + 1}` : `Question ${currentQuestionIndex + 1}`}: {isRTL && currentQuestion.stemFA ? currentQuestion.stemFA : currentQuestion.stem}
                  </p>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                    {currentQuestion.points || 1} {isRTL ? 'امتیاز' : 'pts'}
                  </span>
                </div>

                {(currentQuestion.type === 'MULTIPLE_CHOICE' || currentQuestion.type === 'TRUE_FALSE') ? (
                  <div className="space-y-2">
                    {currentQuestion.options.map((option: any) => (
                      <label key={option.id} className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          name={`q-${currentQuestion.id}`}
                          className="w-4 h-4"
                          checked={answers[currentQuestion.id]?.optionId === option.id}
                          onChange={() => updateAnswer(currentQuestion.id, { optionId: option.id, value: option.text })}
                        />
                        <span>{isRTL && option.textFA ? option.textFA : option.text}</span>
                      </label>
                    ))}
                  </div>
                ) : currentQuestion.type === 'MULTIPLE_SELECT' ? (
                  <div className="space-y-2">
                    {currentQuestion.options.map((option: any) => {
                      const selectedIds = Array.isArray(answers[currentQuestion.id]?.optionIds) ? answers[currentQuestion.id].optionIds : [];
                      const checked = selectedIds.includes(option.id);
                      return (
                        <label key={option.id} className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            className="w-4 h-4"
                            checked={checked}
                            onChange={() => {
                              const nextIds = checked
                                ? selectedIds.filter((id: string) => id !== option.id)
                                : [...selectedIds, option.id];
                              updateAnswer(currentQuestion.id, { optionIds: nextIds });
                            }}
                          />
                          <span>{isRTL && option.textFA ? option.textFA : option.text}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <textarea
                      rows={currentQuestion.type === 'LONG_ANSWER' ? 8 : 4}
                      value={answers[currentQuestion.id]?.value || answers[currentQuestion.id] || ''}
                      onChange={(event) => updateAnswer(currentQuestion.id, { value: event.target.value })}
                      placeholder={isRTL ? 'پاسخ خود را با استدلال و شواهد بنویسید...' : 'Write your answer with reasoning and evidence...'}
                      className="w-full rounded-xl border bg-background px-4 py-3 text-sm leading-7"
                    />
                    <p className="text-xs text-muted-foreground">
                      {isRTL
                        ? 'پاسخ‌های تشریحی ابتدا توسط دستیار هوش مصنوعی بررسی و سپس با تأیید نهایی معلم ثبت می‌شوند.'
                        : 'Written responses receive an AI draft review first and become official after teacher approval.'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="border rounded-lg p-6 text-muted-foreground">
                {isRTL ? 'سوالی برای این ارزیابی ثبت نشده است.' : 'No questions are available for this assessment.'}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="rounded-xl border px-4 py-2 text-sm disabled:opacity-50"
              >
                {isRTL ? 'سوال قبلی' : 'Previous question'}
              </button>

              {currentQuestionIndex < normalizedQuestions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentQuestionIndex((prev) => Math.min(normalizedQuestions.length - 1, prev + 1))}
                  className="rounded-xl bg-muted px-4 py-2 text-sm"
                >
                  {isRTL ? 'سوال بعدی' : 'Next question'}
                </button>
              ) : null}
            </div>
          </div>

          <button
            onClick={() => void handleSubmit()}
            disabled={!attemptId || submitting || normalizedQuestions.length === 0}
            className="mt-6 w-full bg-green-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-600 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <CheckCircle className="w-5 h-5" />
            {submitting ? (isRTL ? 'در حال ارسال...' : 'Submitting...') : (isRTL ? 'ارسال ارزیابی' : 'Submit Assessment')}
          </button>
        </div>
      ) : (
        <div className="text-center py-12">
          <Award className="w-20 h-20 mx-auto mb-4 text-green-500" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {isRTL ? 'عالی کار!' : 'Great Work!'}
          </h3>
          <div className="mx-auto max-w-2xl space-y-3 text-gray-600">
            <p>
              {submissionResult?.hasPendingReview
                ? (isRTL
                    ? 'بخش‌های تشریحی شما برای بررسی نهایی معلم ارسال شد. پس از تأیید معلم، نتیجه رسمی در کارنامه نمایش داده می‌شود.'
                    : 'Your written responses were sent for final teacher review. The official result will appear in the marksheet after approval.')
                : (isRTL
                    ? 'ارزیابی شما نمره‌گذاری شد و نتیجه در کارنامه قابل مشاهده است.'
                    : 'Your assessment was graded and the result is now available in the marksheet.')}
            </p>
            {submissionResult ? (
              <p className="font-medium text-foreground">
                {submissionResult.percentage !== null
                  ? `${isRTL ? 'نتیجه فعلی' : 'Current result'}: ${submissionResult.autoGradedScore}/${submissionResult.maxScore} • ${submissionResult.percentage}%`
                  : `${isRTL ? 'امتیاز خودکار فعلی' : 'Current auto-graded score'}: ${submissionResult.autoGradedScore}/${submissionResult.maxScore}`}
              </p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
