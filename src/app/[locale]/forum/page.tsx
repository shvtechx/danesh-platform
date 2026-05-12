'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle,
  Clock,
  Eye,
  HelpCircle,
  MessageSquare,
  Plus,
  Search,
  Tag,
  ThumbsUp,
  TrendingUp,
  Users,
} from 'lucide-react';
import { StudentShell } from '@/components/layout/StudentShell';
import { StudentPageHeader } from '@/components/layout/StudentPageHeader';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { createUserHeaders, getStoredUserId } from '@/lib/auth/demo-auth-shared';

type ForumCategory = {
  id: string;
  name: string;
  nameFA?: string | null;
  icon?: string | null;
  color: string;
  count: number;
};

type ForumThread = {
  id: string;
  authorId: string;
  title: string;
  titleFA?: string | null;
  preview: string;
  previewFA?: string | null;
  categoryId: string;
  categoryName: string;
  categoryNameFA?: string | null;
  categoryColor: string;
  author: string;
  avatar: string;
  replies: number;
  views: number;
  likes: number;
  solved: boolean;
  lastActivityAt: string;
  createdAt: string;
  isMine: boolean;
};

type ForumContributor = {
  id: string;
  name: string;
  avatar: string;
  answers: number;
};

type ForumOverview = {
  categories: ForumCategory[];
  threads: ForumThread[];
  stats: {
    totalDiscussions: number;
    solvedDiscussions: number;
    activeMembers: number;
    totalReplies: number;
  };
  topContributors: ForumContributor[];
};

const EMPTY_FORUM: ForumOverview = {
  categories: [],
  threads: [],
  stats: {
    totalDiscussions: 0,
    solvedDiscussions: 0,
    activeMembers: 0,
    totalReplies: 0,
  },
  topContributors: [],
};

function formatRelativeTime(value: string, isRTL: boolean) {
  const diff = Date.now() - new Date(value).getTime();
  const hours = Math.max(1, Math.floor(diff / (1000 * 60 * 60)));

  if (hours < 24) {
    return isRTL ? `${hours} ساعت پیش` : `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return isRTL ? `${days} روز پیش` : `${days}d ago`;
  }

  return new Intl.DateTimeFormat(isRTL ? 'fa-IR' : 'en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

export default function ForumPage({ params: { locale } }: { params: { locale: string } }) {
  const isRTL = locale === 'fa';
  const [activeTab, setActiveTab] = useState<'recent' | 'popular' | 'unanswered' | 'my'>('recent');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [forum, setForum] = useState<ForumOverview>(EMPTY_FORUM);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const userId = getStoredUserId();
    setCurrentUserId(userId);

    let active = true;

    const loadForum = async () => {
      try {
        setIsLoading(true);
        setFeedback(null);

        const response = await fetch('/api/v1/forum', {
          cache: 'no-store',
          headers: createUserHeaders(userId),
        });

        if (!response.ok) {
          throw new Error('Failed to load forum');
        }

        const result = (await response.json()) as { success: boolean; data?: ForumOverview };
        if (!result.success) {
          throw new Error('Failed to load forum');
        }

        if (active) {
          setForum(result.data || EMPTY_FORUM);
        }
      } catch {
        if (active) {
          setFeedback(isRTL ? 'بارگذاری انجمن انجام نشد.' : 'Forum data could not be loaded.');
          setForum(EMPTY_FORUM);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadForum();

    return () => {
      active = false;
    };
  }, [isRTL]);

  const tabs = [
    { id: 'recent' as const, name: isRTL ? 'جدیدترین' : 'Recent', icon: Clock },
    { id: 'popular' as const, name: isRTL ? 'محبوب‌ترین' : 'Popular', icon: TrendingUp },
    { id: 'unanswered' as const, name: isRTL ? 'بی‌پاسخ' : 'Unanswered', icon: HelpCircle },
    { id: 'my' as const, name: isRTL ? 'سوالات من' : 'My Questions', icon: MessageSquare },
  ];

  const categories = useMemo(
    () => [
      {
        id: 'all',
        name: isRTL ? 'همه' : 'All',
        count: forum.threads.length,
        color: 'bg-gray-500',
      },
      ...forum.categories.map((category) => ({
        id: category.id,
        name: isRTL ? category.nameFA || category.name : category.name,
        count: category.count,
        color: category.color,
      })),
    ],
    [forum.categories, forum.threads.length, isRTL],
  );

  const filteredThreads = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    let items = forum.threads.filter((thread) => {
      const matchesCategory = activeCategory === 'all' || thread.categoryId === activeCategory;
      const title = (isRTL ? thread.titleFA || thread.title : thread.title).toLowerCase();
      const preview = (isRTL ? thread.previewFA || thread.preview : thread.preview).toLowerCase();
      const matchesSearch = !normalizedSearch || title.includes(normalizedSearch) || preview.includes(normalizedSearch);

      if (!matchesCategory || !matchesSearch) {
        return false;
      }

      if (activeTab === 'unanswered') {
        return thread.replies === 0 && !thread.solved;
      }

      if (activeTab === 'my') {
        return currentUserId ? thread.authorId === currentUserId || thread.isMine : false;
      }

      return true;
    });

    if (activeTab === 'popular') {
      items = [...items].sort(
        (left, right) => right.likes + right.views + right.replies - (left.likes + left.views + left.replies),
      );
    } else {
      items = [...items].sort(
        (left, right) => new Date(right.lastActivityAt).getTime() - new Date(left.lastActivityAt).getTime(),
      );
    }

    return items;
  }, [activeCategory, activeTab, currentUserId, forum.threads, isRTL, searchQuery]);

  return (
    <StudentShell locale={locale}>
      <div className="space-y-6">
        <StudentPageHeader
          locale={locale}
          eyebrow={isRTL ? 'جامعه یادگیری' : 'Learning community'}
          title={isRTL ? 'انجمن گفتگو' : 'Forum'}
          description={isRTL ? 'پرسش‌ها، بحث‌های همدلانه و پاسخ‌های همیارانه را در یک فضای منسجم و ایمن دنبال کنید.' : 'Follow questions, thoughtful discussions, and peer support in a cohesive and safe community space.'}
          stats={[
            { label: isRTL ? 'کل بحث‌ها' : 'Total discussions', value: isLoading ? '—' : forum.stats.totalDiscussions.toLocaleString(isRTL ? 'fa-IR' : 'en-US'), icon: MessageSquare, tone: 'primary', helper: isRTL ? 'گفتگوهای ثبت‌شده' : 'Posted discussions' },
            { label: isRTL ? 'حل شده' : 'Solved', value: isLoading ? '—' : forum.stats.solvedDiscussions.toLocaleString(isRTL ? 'fa-IR' : 'en-US'), icon: CheckCircle, tone: 'success', helper: isRTL ? 'پرسش‌های پاسخ‌گرفته' : 'Questions with answers' },
            { label: isRTL ? 'اعضای فعال' : 'Active members', value: isLoading ? '—' : forum.stats.activeMembers.toLocaleString(isRTL ? 'fa-IR' : 'en-US'), icon: Users, tone: 'accent', helper: isRTL ? 'همیاری زنده' : 'Community participation' },
          ]}
          actions={
            <Link href={`/${locale}/forum/new`} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              {isRTL ? 'سوال جدید' : 'Ask question'}
            </Link>
          }
        />

        <div>
        {feedback ? <FeedbackBanner className="mb-6" variant="error" message={feedback} /> : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <div className="rounded-3xl border bg-card p-3 shadow-sm">
              <div className="flex gap-1 overflow-x-auto rounded-2xl bg-muted p-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-4 py-2 text-sm transition-colors ${activeTab === tab.id ? 'bg-background font-medium shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.name}
                  </button>
                );
              })}
              </div>
            </div>

            <div className="space-y-3">
              {filteredThreads.map((thread) => (
                <Link key={thread.id} href={`/${locale}/forum/${thread.id}`} className="block rounded-3xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md">
                  <div className="flex gap-4">
                    <div className="hidden h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-bold text-primary sm:flex">
                      {thread.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold hover:text-primary">{isRTL ? thread.titleFA || thread.title : thread.title}</h3>
                            {thread.solved ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600">
                                <CheckCircle className="h-3 w-3" />
                                {isRTL ? 'حل شده' : 'Solved'}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{isRTL ? thread.previewFA || thread.preview : thread.preview}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{thread.author}</span>
                        <span className="inline-flex items-center gap-2 rounded-full border px-2 py-0.5">
                          <span className={`h-2 w-2 rounded-full ${thread.categoryColor}`} />
                          {isRTL ? thread.categoryNameFA || thread.categoryName : thread.categoryName}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {thread.replies.toLocaleString(isRTL ? 'fa-IR' : 'en-US')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {thread.views.toLocaleString(isRTL ? 'fa-IR' : 'en-US')}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          {thread.likes.toLocaleString(isRTL ? 'fa-IR' : 'en-US')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(thread.lastActivityAt, isRTL)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {!isLoading && filteredThreads.length === 0 ? (
              <div className="rounded-3xl border border-dashed bg-card py-12 text-center">
                <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 font-semibold">{isRTL ? 'بحثی یافت نشد' : 'No discussions found'}</h3>
                <p className="mb-4 text-sm text-muted-foreground">{isRTL ? 'اولین نفری باشید که یک پرسش روشن و دقیق مطرح می‌کند.' : 'Be the first to post a clear and thoughtful question.'}</p>
                <Link href={`/${locale}/forum/new`} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground">
                  <Plus className="h-4 w-4" />
                  {isRTL ? 'سوال جدید' : 'Ask Question'}
                </Link>
              </div>
            ) : null}
          </div>

          <aside className="space-y-4 xl:w-[320px]">
            <div className="relative rounded-3xl border bg-card p-3 shadow-sm">
              <Search className="absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground start-3" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={isRTL ? 'جستجو در انجمن...' : 'Search forum...'}
                className="w-full rounded-2xl border bg-background py-2.5 ps-10 pe-4 text-sm"
              />
            </div>

            <div className="rounded-3xl border bg-card p-4 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 font-semibold">
                <Tag className="h-4 w-4" />
                {isRTL ? 'دسته‌بندی‌ها' : 'Categories'}
              </h3>
              <div className="space-y-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setActiveCategory(category.id)}
                    className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-sm transition-colors ${activeCategory === category.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${category.color}`} />
                      <span>{category.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{category.count.toLocaleString(isRTL ? 'fa-IR' : 'en-US')}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border bg-card p-4 shadow-sm">
              <h3 className="mb-3 font-semibold">{isRTL ? 'برترین پاسخ‌دهندگان' : 'Top Contributors'}</h3>
              <div className="space-y-2">
                {forum.topContributors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{isRTL ? 'با اولین پاسخ‌ها، این بخش زنده می‌شود.' : 'This section will come alive as replies are posted.'}</p>
                ) : (
                  forum.topContributors.map((user) => (
                    <div key={user.id} className="flex items-center gap-3 rounded-2xl p-2 hover:bg-muted">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {user.avatar}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.answers.toLocaleString(isRTL ? 'fa-IR' : 'en-US')} {isRTL ? 'پاسخ' : 'answers'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
        </div>
      </div>
    </StudentShell>
  );
}
