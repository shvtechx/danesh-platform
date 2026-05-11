'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CheckCircle,
  Eye,
  Home,
  MessageSquare,
  Send,
  Share2,
  ThumbsUp,
} from 'lucide-react';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { createUserHeaders, getStoredUserId } from '@/lib/auth/demo-auth-shared';

type ForumReply = {
  id: string;
  parentId?: string | null;
  content: string;
  contentFA?: string | null;
  isAccepted: boolean;
  createdAt: string;
  likes: number;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
};

type ForumThreadDetail = {
  id: string;
  authorId: string;
  title: string;
  titleFA?: string | null;
  content: string;
  contentFA?: string | null;
  category: {
    id: string;
    name: string;
    nameFA?: string | null;
    color: string;
  };
  createdAt: string;
  views: number;
  likes: number;
  solved: boolean;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  replies: ForumReply[];
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

export default function ForumDetailPage({ params: { locale, id } }: { params: { locale: string; id: string } }) {
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;
  const [thread, setThread] = useState<ForumThreadDetail | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ variant: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    const userId = getStoredUserId();
    setCurrentUserId(userId);

    let active = true;

    const loadThread = async () => {
      try {
        setIsLoading(true);
        setFeedback(null);

        const response = await fetch(`/api/v1/forum/${id}`, {
          cache: 'no-store',
          headers: createUserHeaders(userId),
        });

        const result = (await response.json()) as { success: boolean; error?: string; data?: ForumThreadDetail };
        if (!response.ok || !result.success || !result.data) {
          throw new Error(result.error || 'Thread not found');
        }

        if (active) {
          setThread(result.data);
        }
      } catch (error) {
        if (active) {
          setThread(null);
          setFeedback({
            variant: 'error',
            message: error instanceof Error ? error.message : isRTL ? 'بارگذاری بحث انجام نشد.' : 'Discussion could not be loaded.',
          });
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadThread();

    return () => {
      active = false;
    };
  }, [id, isRTL]);

  const handleShare = async () => {
    if (!thread) {
      return;
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: isRTL ? thread.titleFA || thread.title : thread.title,
          text: isRTL ? thread.contentFA || thread.content : thread.content,
          url: window.location.href,
        });
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
      }

      setFeedback({
        variant: 'success',
        message: isRTL ? 'پیوند بحث برای اشتراک آماده شد.' : 'Discussion link is ready to share.',
      });
    } catch {
      setFeedback({
        variant: 'info',
        message: isRTL ? 'اشتراک‌گذاری لغو شد.' : 'Sharing was cancelled.',
      });
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!replyText.trim()) {
      return;
    }

    if (!currentUserId) {
      setFeedback({
        variant: 'info',
        message: isRTL ? 'برای پاسخ‌دادن ابتدا وارد حساب کاربری شوید.' : 'Please sign in before replying.',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);

      const response = await fetch(`/api/v1/forum/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...createUserHeaders(currentUserId),
        },
        body: JSON.stringify({
          content: replyText.trim(),
          locale,
        }),
      });

      const result = (await response.json()) as { success: boolean; error?: string };
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Reply could not be saved');
      }

      setReplyText('');
      setFeedback({
        variant: 'success',
        message: isRTL ? 'پاسخ شما ثبت شد.' : 'Your reply has been posted.',
      });

      const refresh = await fetch(`/api/v1/forum/${id}`, {
        cache: 'no-store',
        headers: createUserHeaders(currentUserId),
      });

      if (refresh.ok) {
        const refreshed = (await refresh.json()) as { success: boolean; data?: ForumThreadDetail };
        if (refreshed.success && refreshed.data) {
          setThread(refreshed.data);
        }
      }
    } catch (error) {
      setFeedback({
        variant: 'error',
        message: error instanceof Error ? error.message : isRTL ? 'ارسال پاسخ انجام نشد.' : 'Reply could not be submitted.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplyShortcut = (replyAuthor: string) => {
    setReplyText(`@${replyAuthor} `);
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
            <span className="max-w-[200px] truncate text-sm text-muted-foreground">
              {thread ? (isRTL ? thread.category.nameFA || thread.category.name : thread.category.name) : (isRTL ? 'بحث' : 'Discussion')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/${locale}`} className="rounded-lg p-2 hover:bg-muted" title={isRTL ? 'صفحه اصلی' : 'Home'}>
              <Home className="h-5 w-5" />
            </Link>
            <button type="button" onClick={() => setBookmarked((current) => !current)} className={`rounded-lg p-2 hover:bg-muted ${bookmarked ? 'text-yellow-500' : ''}`}>
              <Bookmark className={`h-5 w-5 ${bookmarked ? 'fill-current' : ''}`} />
            </button>
            <button type="button" onClick={handleShare} className="rounded-lg p-2 hover:bg-muted">
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        {feedback ? <FeedbackBanner variant={feedback.variant} message={feedback.message} /> : null}

        {isLoading ? (
          <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
            {isRTL ? 'در حال بارگذاری بحث...' : 'Loading discussion...'}
          </div>
        ) : !thread ? (
          <div className="rounded-xl border border-dashed bg-card p-10 text-center text-muted-foreground">
            <MessageSquare className="mx-auto mb-3 h-10 w-10 opacity-60" />
            <p>{isRTL ? 'بحث مورد نظر پیدا نشد.' : 'The requested discussion was not found.'}</p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border bg-card">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="hidden sm:block">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                      {thread.author.avatar}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h1 className="text-xl font-bold">{isRTL ? thread.titleFA || thread.title : thread.title}</h1>
                      {thread.solved ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          {isRTL ? 'حل شده' : 'Solved'}
                        </span>
                      ) : null}
                    </div>
                    <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{thread.author.name}</span>
                      <span>•</span>
                      <span>{formatRelativeTime(thread.createdAt, isRTL)}</span>
                      <span className="inline-flex items-center gap-2 rounded-full border px-2 py-0.5">
                        <span className={`h-2 w-2 rounded-full ${thread.category.color}`} />
                        {isRTL ? thread.category.nameFA || thread.category.name : thread.category.name}
                      </span>
                    </div>
                    <div className="whitespace-pre-line text-sm leading-7 text-foreground/90">
                      {isRTL ? thread.contentFA || thread.content : thread.content}
                    </div>
                    <div className="mt-6 flex flex-wrap items-center gap-4 border-t pt-4">
                      <button type="button" onClick={() => setLiked((current) => !current)} className={`flex items-center gap-2 rounded-lg px-3 py-1.5 transition-colors ${liked ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}>
                        <ThumbsUp className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                        <span>{thread.likes + (liked ? 1 : 0)}</span>
                      </button>
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        {thread.views}
                      </span>
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MessageSquare className="h-4 w-4" />
                        {thread.replies.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="flex items-center gap-2 font-semibold">
                <MessageSquare className="h-5 w-5" />
                {thread.replies.length} {isRTL ? 'پاسخ' : 'Replies'}
              </h2>

              {thread.replies.length === 0 ? (
                <div className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
                  {isRTL ? 'هنوز پاسخی ثبت نشده است.' : 'No replies have been posted yet.'}
                </div>
              ) : (
                thread.replies.map((reply) => (
                  <div key={reply.id} className={`rounded-xl border bg-card p-6 ${reply.isAccepted ? 'border-green-500 ring-1 ring-green-500/20' : ''}`}>
                    {reply.isAccepted ? (
                      <div className="mb-4 flex items-center gap-2 border-b border-green-500/20 pb-4 text-sm font-medium text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        {isRTL ? 'پاسخ پذیرفته‌شده' : 'Accepted answer'}
                      </div>
                    ) : null}
                    <div className="flex items-start gap-4">
                      <div className="hidden sm:block">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {reply.author.avatar}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
                          <span className="font-medium">{reply.author.name}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">{formatRelativeTime(reply.createdAt, isRTL)}</span>
                        </div>
                        <div className="whitespace-pre-line text-sm leading-7 text-foreground/90">
                          {isRTL ? reply.contentFA || reply.content : reply.content}
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-4 border-t pt-3">
                          <span className="flex items-center gap-2 text-sm text-muted-foreground">
                            <ThumbsUp className="h-4 w-4" />
                            {reply.likes}
                          </span>
                          <button type="button" onClick={() => handleReplyShortcut(reply.author.name)} className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                            {isRTL ? 'پاسخ' : 'Reply'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="rounded-xl border bg-card p-6">
              <h3 className="mb-4 font-semibold">{isRTL ? 'پاسخ شما' : 'Your Reply'}</h3>
              <form onSubmit={handleSubmit}>
                <textarea
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  placeholder={isRTL ? 'پاسخ خود را بنویسید...' : 'Write your reply...'}
                  rows={4}
                  className="mb-4 w-full resize-none rounded-xl border bg-background p-4"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting || !replyText.trim()}
                    className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isSubmitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Send className="h-4 w-4" />}
                    {isRTL ? 'ارسال پاسخ' : 'Submit Reply'}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
