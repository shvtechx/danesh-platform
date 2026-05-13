'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUserHeaders, getStoredUserId } from '@/lib/auth/demo-auth-shared';
import { extractSafeEmbedConfig, normalizeExternalEmbedUrl } from '@/lib/content/embed-utils';
import {
  ArrowLeft, ArrowRight, CheckCircle, ChevronRight,
  Eye, FileText, Video, Image as ImageIcon, BookOpen,
  Lightbulb, Search, PenTool, Target, Clock, X, Code, ExternalLink
} from 'lucide-react';

// ── Video embed helper ──────────────────────────────────────────────────────
function getVideoEmbedUrl(url: string): string {
  if (!url) return '';
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/|youtube\.com\/v\/)([\w-]{11})/
  );
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  const aparatMatch = url.match(/aparat\.com\/v\/([^/?&]+)/);
  if (aparatMatch) return `https://www.aparat.com/video/video/embed/videohash/${aparatMatch[1]}/vt/frame`;
  if (url.includes('/embed/') || url.includes('player.')) return url;
  return url;
}

// ── Markdown renderer ───────────────────────────────────────────────────────
function markdownToHtml(md: string): string {
  if (!md) return '';
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mt-4 mb-2 text-foreground">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-5 mb-2 text-foreground">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-3 text-foreground">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-muted rounded px-1 text-sm font-mono">$1</code>')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-primary/40 pl-4 italic text-muted-foreground my-3">$1</blockquote>')
    .replace(/^- \[ \] (.+)$/gm, '<li class="ml-5 list-none flex gap-2 items-center"><span class="w-4 h-4 rounded border border-border inline-block shrink-0"></span>$1</li>')
    .replace(/^- \[x\] (.+)$/gm, '<li class="ml-5 list-none flex gap-2 items-center"><span class="w-4 h-4 rounded bg-primary inline-block shrink-0"></span>$1</li>')
    .replace(/^- (.+)$/gm, '<li class="ml-5 list-disc">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-5 list-decimal">$1</li>')
    .replace(/^---$/gm, '<hr class="my-4 border-border" />')
    .replace(/\n\n/g, '</p><p class="mb-3">')
    .replace(/^(?!<[hlipbr])(.+)$/gm, '<p class="mb-3">$1</p>');
}

// ── Phase definitions ───────────────────────────────────────────────────────
const PHASES: Record<string, { icon: React.ElementType; badge: string; color: string }> = {
  ENGAGE:    { icon: Lightbulb, badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', color: 'border-purple-300' },
  EXPLORE:   { icon: Search,    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',     color: 'border-blue-300' },
  EXPLAIN:   { icon: BookOpen,  badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',  color: 'border-green-300' },
  ELABORATE: { icon: PenTool,   badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300', color: 'border-orange-300' },
  EVALUATE:  { icon: Target,    badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',         color: 'border-red-300' },
};

interface ContentBlock {
  id: string;
  type: 'text' | 'video' | 'image' | 'quiz' | 'activity' | 'simulation';
  title: string;
  content: string;
  sequence: number;
}

interface LessonMeta {
  title: string;
  titleFA?: string;
  phase: string;
  estimatedTime?: number;
  unit?: { title: string; course?: { title: string } };
}

export default function TeacherLessonPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as string) || 'en';
  const lessonId = params.id as string;
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;

  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [meta, setMeta] = useState<LessonMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch(`/api/v1/teacher/lessons/${lessonId}/content`, {
        headers: createUserHeaders(getStoredUserId()),
      }).then((r) => r.json()),
      fetch(`/api/v1/lessons/${lessonId}`).then((r) => r.json()),
    ])
      .then(([contentData, lessonData]) => {
        const rawBlocks: ContentBlock[] = (contentData.blocks || [])
          .filter((b: any) => b.content?.trim())
          .map((b: any, i: number) => ({
            id: b.id || String(i),
            type: b.type || 'text',
            title: b.title || `Block ${i + 1}`,
            content: b.content || '',
            sequence: i,
          }));
        setBlocks(rawBlocks);
        if (lessonData.lesson) setMeta(lessonData.lesson);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [lessonId]);

  const phase = PHASES[meta?.phase ?? 'EXPLAIN'] ?? PHASES.EXPLAIN;
  const PhaseIcon = phase.icon;
  const current = blocks[currentIndex];
  const total = blocks.length;
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Preview banner */}
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-green-300 bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          <span>{isRTL ? 'حالت پیش‌نمایش معلم — همین چیزی را که دانش‌آموزان می‌بینند' : 'Teacher Preview — Exactly what students will see'}</span>
        </div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 rounded-full border border-white/40 px-3 py-1 text-xs hover:bg-white/20"
        >
          <X className="h-3 w-3" />
          {isRTL ? 'بستن پیش‌نمایش' : 'Close Preview'}
        </button>
      </div>

      {/* Nav bar */}
      <header className="sticky top-10 z-40 border-b bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-3 px-4">
          <Link href={`/${locale}/teacher/content`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <Arrow className="h-4 w-4" />
            {isRTL ? 'بازگشت به ویرایشگر' : 'Back to Editor'}
          </Link>
          {meta && (
            <>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
              <span className="text-sm text-muted-foreground">{meta.unit?.course?.title}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
              <span className="text-sm font-medium truncate">{isRTL && meta.titleFA ? meta.titleFA : meta.title}</span>
            </>
          )}
          <div className="flex-1" />
          {meta?.phase && (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${phase.badge}`}>
              <PhaseIcon className="h-3.5 w-3.5" />
              {meta.phase.charAt(0) + meta.phase.slice(1).toLowerCase()}
            </span>
          )}
          {meta?.estimatedTime && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {meta.estimatedTime} {isRTL ? 'دقیقه' : 'min'}
            </div>
          )}
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : blocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-24 text-center">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold text-muted-foreground">{isRTL ? 'هنوز محتوایی اضافه نشده' : 'No content added yet'}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{isRTL ? 'از ویرایشگر محتوا بلوک اضافه کنید.' : 'Add blocks from the content editor.'}</p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border bg-card p-8 shadow-sm">
              {/* Block type chip */}
              <div className="mb-4 flex items-center gap-2">
                {current?.type === 'video' && <Video className="h-4 w-4 text-muted-foreground" />}
                {current?.type === 'image' && <ImageIcon className="h-4 w-4 text-muted-foreground" />}
                {current?.type === 'text' && <FileText className="h-4 w-4 text-muted-foreground" />}
                {current?.type === 'simulation' && <Code className="h-4 w-4 text-muted-foreground" />}
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {isRTL ? `بلوک ${currentIndex + 1} از ${total}` : `Block ${currentIndex + 1} of ${total}`}
                </span>
              </div>

              {/* Video block */}
              {current?.type === 'video' && (() => {
                const embed = getVideoEmbedUrl(current.content);
                return embed ? (
                  <div className="aspect-video w-full overflow-hidden rounded-xl bg-black shadow-lg">
                    <iframe
                      src={embed}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={current.title}
                    />
                  </div>
                ) : (
                  <div className="flex aspect-video items-center justify-center rounded-xl bg-muted">
                    <p className="text-muted-foreground">{isRTL ? 'لینک ویدیو نامعتبر است' : 'Invalid video URL'}</p>
                  </div>
                );
              })()}

              {/* Image block */}
              {current?.type === 'image' && current.content && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={current.content} alt="" className="w-full rounded-xl object-cover" />
              )}

              {/* Text block */}
              {current?.type === 'text' && (
                <div
                  className="prose prose-neutral dark:prose-invert max-w-none leading-relaxed text-foreground"
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(current.content) }}
                />
              )}

              {current?.type === 'simulation' && (() => {
                const embed = extractSafeEmbedConfig(current.content);
                return embed.embedUrl ? (
                  <div className="space-y-4">
                    <div className="aspect-video w-full overflow-hidden rounded-xl border bg-background shadow-lg">
                      <iframe
                        src={embed.embedUrl}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowFullScreen
                        loading="lazy"
                        title={current.title}
                      />
                    </div>
                    <a
                      href={normalizeExternalEmbedUrl(embed.embedUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                    >
                      {isRTL ? 'باز کردن در پنجره جدید' : 'Open in a new tab'}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                ) : (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
                    {isRTL ? 'کد یا لینک شبیه‌سازی معتبر نیست.' : 'The simulation code or URL is not valid.'}
                  </div>
                );
              })()}
            </div>

            {/* Navigation */}
            <div className="mt-6 flex items-center justify-between gap-4">
              <button
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                {isRTL ? 'قبلی' : 'Previous'}
              </button>

              {/* Dots */}
              <div className="flex gap-1.5">
                {blocks.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`h-2 rounded-full transition-all ${i === currentIndex ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60'}`}
                  />
                ))}
              </div>

              <button
                onClick={() => {
                  if (currentIndex < total - 1) setCurrentIndex((i) => i + 1);
                }}
                disabled={currentIndex >= total - 1}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {currentIndex >= total - 1 ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    {isRTL ? 'پایان درس' : 'End of Lesson'}
                  </>
                ) : (
                  <>
                    {isRTL ? 'بعدی' : 'Next'}
                    {isRTL ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
