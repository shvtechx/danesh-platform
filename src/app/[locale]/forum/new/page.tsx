'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Bold,
  Code,
  HelpCircle,
  Home,
  Image,
  Info,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Send,
} from 'lucide-react';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { createUserHeaders, getStoredUserId } from '@/lib/auth/demo-auth-shared';

type ForumCategory = {
  id: string;
  name: string;
  nameFA?: string | null;
  icon?: string | null;
};

type SimilarThread = {
  id: string;
  title: string;
  titleFA?: string | null;
  replies: number;
  solved: boolean;
};

type ForumOverview = {
  categories: ForumCategory[];
  threads: SimilarThread[];
};

export default function NewForumQuestionPage({ params: { locale } }: { params: { locale: string } }) {
  const router = useRouter();
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ variant: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [threads, setThreads] = useState<SimilarThread[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    categoryId: '',
    content: '',
    tags: '',
  });

  useEffect(() => {
    const userId = getStoredUserId();
    setCurrentUserId(userId);

    let active = true;

    const loadForumMeta = async () => {
      try {
        const response = await fetch('/api/v1/forum', {
          cache: 'no-store',
          headers: createUserHeaders(userId),
        });

        if (!response.ok) {
          throw new Error('Failed to load forum metadata');
        }

        const result = (await response.json()) as { success: boolean; data?: ForumOverview };
        if (!result.success || !result.data) {
          throw new Error('Failed to load forum metadata');
        }

        if (active) {
          setCategories(result.data.categories || []);
          setThreads(result.data.threads.slice(0, 3));
          setFormData((current) => ({
            ...current,
            categoryId: current.categoryId || result.data?.categories?.[0]?.id || '',
          }));
        }
      } catch {
        if (active) {
          setFeedback({
            variant: 'error',
            message: isRTL ? 'بارگذاری دسته‌بندی‌های انجمن انجام نشد.' : 'Forum categories could not be loaded.',
          });
        }
      }
    };

    loadForumMeta();

    return () => {
      active = false;
    };
  }, [isRTL]);

  const tips = isRTL
    ? [
        'عنوان روشن و قابل جستجو بنویسید.',
        'مسئله را با زمینه و نمونه توضیح دهید.',
        'اگر چیزی را امتحان کرده‌اید، آن را ذکر کنید.',
        'لحن محترمانه و رشد‌محور را حفظ کنید.',
      ]
    : [
        'Write a clear, searchable title.',
        'Explain the problem with context and examples.',
        'Mention what you have already tried.',
        'Keep the tone respectful and growth-oriented.',
      ];

  const similarThreads = useMemo(() => {
    const query = formData.title.trim().toLowerCase();
    if (!query) {
      return threads;
    }

    return threads.filter((thread) => {
      const title = (isRTL ? thread.titleFA || thread.title : thread.title).toLowerCase();
      return title.includes(query) || query.includes(title.slice(0, Math.min(title.length, 10)));
    });
  }, [formData.title, isRTL, threads]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const insertIntoContent = (before: string, after = '', placeholder = '') => {
    const snippet = `${before}${placeholder}${after}`;
    setFormData((current) => ({
      ...current,
      content: current.content ? `${current.content}\n${snippet}` : snippet,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!currentUserId) {
      setFeedback({
        variant: 'info',
        message: isRTL ? 'برای ثبت پرسش ابتدا وارد حساب کاربری شوید.' : 'Please sign in before posting a question.',
      });
      return;
    }

    if (!formData.title.trim() || !formData.content.trim() || !formData.categoryId) {
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);

      const response = await fetch('/api/v1/forum', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...createUserHeaders(currentUserId),
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          content: formData.content.trim(),
          categoryId: formData.categoryId,
          locale,
        }),
      });

      const result = (await response.json()) as { success: boolean; error?: string; data?: { id: string } };
      if (!response.ok || !result.success || !result.data?.id) {
        throw new Error(result.error || 'Failed to create thread');
      }

      router.push(`/${locale}/forum/${result.data.id}`);
    } catch (error) {
      setFeedback({
        variant: 'error',
        message: error instanceof Error ? error.message : isRTL ? 'ثبت پرسش انجام نشد.' : 'Question could not be submitted.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href={`/${locale}/forum`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <Arrow className="h-5 w-5" />
              <span className="hidden sm:inline">{isRTL ? 'انجمن' : 'Forum'}</span>
            </Link>
            <div className="h-6 w-px bg-border" />
            <h1 className="font-semibold">{isRTL ? 'سوال جدید' : 'New Question'}</h1>
          </div>
          <Link href={`/${locale}`} className="rounded-lg p-2 hover:bg-muted" title={isRTL ? 'صفحه اصلی' : 'Home'}>
            <Home className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6">
        {feedback ? <FeedbackBanner className="mb-6" variant={feedback.variant} message={feedback.message} /> : null}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="rounded-xl border bg-card p-6">
                <label className="mb-2 block text-sm font-medium">{isRTL ? 'عنوان سوال' : 'Question Title'} *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(event) => handleChange('title', event.target.value)}
                  placeholder={isRTL ? 'مثال: چگونه معادلات درجه دوم حل می‌شوند؟' : 'Example: How do I solve quadratic equations?'}
                  className="w-full rounded-lg border bg-background p-3"
                  required
                />
                <p className="mt-2 text-xs text-muted-foreground">{isRTL ? 'عنوان روشن و دقیق باعث می‌شود پاسخ مناسب‌تری بگیرید.' : 'A clear title helps peers and teachers answer more effectively.'}</p>
              </div>

              <div className="rounded-xl border bg-card p-6">
                <label className="mb-3 block text-sm font-medium">{isRTL ? 'دسته‌بندی' : 'Category'} *</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleChange('categoryId', category.id)}
                      className={`rounded-lg border p-3 text-sm transition-colors ${formData.categoryId === category.id ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                    >
                      <div className="text-base">{category.icon || '💬'}</div>
                      <div className="mt-1">{isRTL ? category.nameFA || category.name : category.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border bg-card p-6">
                <label className="mb-2 block text-sm font-medium">{isRTL ? 'توضیحات سوال' : 'Question Details'} *</label>

                <div className="flex flex-wrap items-center gap-1 rounded-t-lg border bg-muted/50 p-2">
                  <button type="button" onClick={() => insertIntoContent('**', '**', isRTL ? 'متن ضخیم' : 'bold text')} className="rounded p-2 hover:bg-background"><Bold className="h-4 w-4" /></button>
                  <button type="button" onClick={() => insertIntoContent('*', '*', isRTL ? 'متن مورب' : 'italic text')} className="rounded p-2 hover:bg-background"><Italic className="h-4 w-4" /></button>
                  <button type="button" onClick={() => insertIntoContent('`', '`', isRTL ? 'کد' : 'code')} className="rounded p-2 hover:bg-background"><Code className="h-4 w-4" /></button>
                  <button type="button" onClick={() => insertIntoContent('[', '](https://example.com)', isRTL ? 'متن لینک' : 'link text')} className="rounded p-2 hover:bg-background"><LinkIcon className="h-4 w-4" /></button>
                  <button type="button" onClick={() => insertIntoContent('![', '](https://example.com/image.png)', isRTL ? 'توضیح تصویر' : 'image alt')} className="rounded p-2 hover:bg-background"><Image className="h-4 w-4" /></button>
                  <button type="button" onClick={() => insertIntoContent('- ', '', isRTL ? 'مورد فهرست' : 'list item')} className="rounded p-2 hover:bg-background"><List className="h-4 w-4" /></button>
                  <button type="button" onClick={() => insertIntoContent('1. ', '', isRTL ? 'مورد شماره‌دار' : 'numbered item')} className="rounded p-2 hover:bg-background"><ListOrdered className="h-4 w-4" /></button>
                </div>

                <textarea
                  value={formData.content}
                  onChange={(event) => handleChange('content', event.target.value)}
                  placeholder={isRTL ? 'مسئله را با جزئیات توضیح دهید، آنچه امتحان کرده‌اید را بنویسید و اگر لازم است نمونه اضافه کنید.' : 'Explain the problem in detail, mention what you tried, and include examples if needed.'}
                  rows={10}
                  className="w-full resize-none rounded-b-lg border border-t-0 bg-background p-4"
                  required
                />
              </div>

              <div className="rounded-xl border bg-card p-6">
                <label className="mb-2 block text-sm font-medium">{isRTL ? 'تگ‌ها' : 'Tags'}</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(event) => handleChange('tags', event.target.value)}
                  placeholder={isRTL ? 'مثال: ریاضی، معادله، امتحان' : 'Example: math, equation, exam'}
                  className="w-full rounded-lg border bg-background p-3"
                />
                <p className="mt-2 text-xs text-muted-foreground">{isRTL ? 'تگ‌ها فعلاً برای کمک به نگارش پرسش نگه داشته می‌شوند.' : 'Tags are currently kept as drafting support for better prompts.'}</p>
              </div>

              <div className="flex items-center justify-between gap-4">
                <Link href={`/${locale}/forum`} className="rounded-lg border px-6 py-2.5 hover:bg-muted">{isRTL ? 'انصراف' : 'Cancel'}</Link>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.title.trim() || !formData.content.trim() || !formData.categoryId}
                  className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSubmitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Send className="h-4 w-4" />}
                  {isRTL ? 'ارسال سوال' : 'Submit Question'}
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border bg-card p-6">
              <h3 className="mb-4 flex items-center gap-2 font-semibold">
                <HelpCircle className="h-5 w-5 text-primary" />
                {isRTL ? 'راهنمای پرسش خوب' : 'How to Ask Well'}
              </h3>
              <ul className="space-y-3 text-sm">
                {tips.map((tip, index) => (
                  <li key={tip} className="flex items-start gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">{index + 1}</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900/40 dark:bg-blue-950/20">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-blue-700 dark:text-blue-300">
                <Info className="h-5 w-5" />
                {isRTL ? 'قوانین انجمن' : 'Community Guidelines'}
              </h3>
              <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-200">
                <li>• {isRTL ? 'با احترام و همدلی پاسخ دهید.' : 'Respond with respect and empathy.'}</li>
                <li>• {isRTL ? 'پیش از ارسال، پرسش مشابه را بررسی کنید.' : 'Check for similar questions before posting.'}</li>
                <li>• {isRTL ? 'پاسخ‌ها باید مشخص، رشد‌محور و کاربردی باشند.' : 'Answers should be specific, growth-oriented, and actionable.'}</li>
              </ul>
            </div>

            <div className="rounded-xl border bg-card p-6">
              <h3 className="mb-4 font-semibold">{isRTL ? 'بحث‌های مشابه' : 'Similar Discussions'}</h3>
              <div className="space-y-3 text-sm">
                {similarThreads.length === 0 ? (
                  <p className="text-muted-foreground">{isRTL ? 'هنوز بحثی ثبت نشده است.' : 'No discussions have been posted yet.'}</p>
                ) : (
                  similarThreads.map((thread) => (
                    <Link key={thread.id} href={`/${locale}/forum/${thread.id}`} className="block rounded-lg p-3 hover:bg-muted">
                      <span className="text-primary">{isRTL ? thread.titleFA || thread.title : thread.title}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {thread.replies} {isRTL ? 'پاسخ' : 'replies'} • {thread.solved ? (isRTL ? 'حل شده' : 'Solved') : (isRTL ? 'باز' : 'Open')}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
