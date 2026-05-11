'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { PageHeader } from '@/components/admin/PageHeader';
import { SkillSelector } from '@/components/admin/SkillSelector';
import {
  CheckCircle,
  XCircle,
  Clock,
  BookOpen,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface ContentItem {
  id: string;
  questionText: string;
  questionTextFA?: string;
  questionType: string;
  gradeLevel?: number;
  subjectCode?: string;
  reviewStatus: string;
  createdAt: string;
  source: {
    name: string;
    nameFA: string;
  };
}

interface PendingApproval {
  itemIds: string[];
  subject?: string;
  gradeLevel?: number;
}

const statusConfig = {
  PENDING: {
    label: 'Pending Review',
    labelFA: 'در انتظار بررسی',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: Clock,
  },
  APPROVED: {
    label: 'Approved',
    labelFA: 'تایید شده',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: CheckCircle,
  },
  REJECTED: {
    label: 'Rejected',
    labelFA: 'رد شده',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
  },
  NEEDS_EDIT: {
    label: 'Needs Edit',
    labelFA: 'نیاز به ویرایش',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Clock,
  },
};

export default function ContentLibraryPage() {
  const params = useParams();
  const t = useTranslations();
  const locale = params.locale as string;
  const isRTL = locale === 'fa';

  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('PENDING');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showSkillSelector, setShowSkillSelector] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<PendingApproval | null>(null);
  const [feedback, setFeedback] = useState<{ variant: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [rejectingItemId, setRejectingItemId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchContent();
  }, [filter, page]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: filter !== 'ALL' ? filter : '',
        page: page.toString(),
        limit: '20',
      });

      const res = await fetch(`/api/v1/admin/scraped-content?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');

      const data = await res.json();
      setContent(data.items || []);
      setTotal(data.pagination?.total || 0);
      setStats(data.stats || {});
    } catch (error) {
      console.error('Error fetching content:', error);
      setContent([]);
      setFeedback({
        variant: 'error',
        message: isRTL ? 'بارگذاری کتابخانه محتوا انجام نشد.' : 'Failed to load the content library.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    // Find the item to get its subject and grade
    const item = content.find((c) => c.id === id);
    setPendingApproval({
      itemIds: [id],
      subject: item?.subjectCode,
      gradeLevel: item?.gradeLevel,
    });
    setShowSkillSelector(true);
  };

  const confirmApproval = async (skillId: string) => {
    if (!pendingApproval) return;

    try {
      setIsSubmitting(true);
      // If single item
      if (pendingApproval.itemIds.length === 1) {
        const res = await fetch(
          `/api/v1/admin/scraped-content/${pendingApproval.itemIds[0]}/approve`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ skillId }),
          }
        );

        if (!res.ok) throw new Error('Failed to approve');
        setFeedback({
          variant: 'success',
          message: isRTL ? 'محتوا با موفقیت تایید شد.' : 'Content approved successfully.',
        });
      } else {
        // Bulk approval
        const res = await fetch('/api/v1/admin/scraped-content/bulk-approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentIds: pendingApproval.itemIds,
            defaultSkillId: skillId,
          }),
        });

        if (!res.ok) throw new Error('Failed to bulk approve');

        const data = await res.json();
        setFeedback({
          variant: data.results.failed > 0 ? 'info' : 'success',
          message: isRTL
            ? `تایید گروهی تکمیل شد: ${data.results.succeeded} موفق، ${data.results.failed} ناموفق`
            : `Bulk approval complete: ${data.results.succeeded} succeeded, ${data.results.failed} failed`,
        });
        setSelectedItems(new Set());
      }

      setShowSkillSelector(false);
      setPendingApproval(null);
      fetchContent();
    } catch (error) {
      console.error('Error approving:', error);
      setFeedback({
        variant: 'error',
        message: isRTL ? 'تایید محتوا انجام نشد.' : 'Failed to approve content.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingItemId || !rejectionReason.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/v1/admin/scraped-content/${rejectingItemId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason: rejectionReason.trim() }),
      });

      if (!res.ok) throw new Error('Failed to reject');

      setFeedback({
        variant: 'success',
        message: isRTL ? 'محتوا رد شد.' : 'Content rejected.',
      });
      setRejectingItemId(null);
      setRejectionReason('');
      fetchContent();
    } catch (error) {
      console.error('Error rejecting:', error);
      setFeedback({
        variant: 'error',
        message: isRTL ? 'رد محتوا انجام نشد.' : 'Failed to reject content.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedItems.size === 0) {
      setFeedback({
        variant: 'info',
        message: isRTL ? 'ابتدا حداقل یک مورد را انتخاب کنید.' : 'Select at least one item first.',
      });
      return;
    }

    // Find common subject/grade from selected items
    const selectedContent = content.filter((c) => selectedItems.has(c.id));
    const subjects = Array.from(new Set(selectedContent.map((c) => c.subjectCode).filter(Boolean)));
    const grades = Array.from(new Set(selectedContent.map((c) => c.gradeLevel).filter(Boolean)));

    setPendingApproval({
      itemIds: Array.from(selectedItems),
      subject: subjects.length === 1 ? subjects[0] : undefined,
      gradeLevel: grades.length === 1 ? grades[0] : undefined,
    });
    setShowSkillSelector(true);
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const selectAll = () => {
    if (selectedItems.size === content.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(content.map((c) => c.id)));
    }
  };

  const filteredContent = content.filter((item) =>
    searchQuery
      ? item.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.questionTextFA?.includes(searchQuery)
      : true
  );

  const statsArray = [
    {
      label: 'Pending Review',
      value: stats.PENDING || 0,
      icon: Clock,
      color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400',
    },
    {
      label: 'Approved',
      value: stats.APPROVED || 0,
      icon: CheckCircle,
      color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400',
    },
    {
      label: 'Rejected',
      value: stats.REJECTED || 0,
      icon: XCircle,
      color: 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400',
    },
    {
      label: 'Total Items',
      value: Object.values(stats).reduce((a, b) => a + b, 0),
      icon: BookOpen,
      color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Skill Selector Modal */}
      {showSkillSelector && pendingApproval && (
        <SkillSelector
          onSelect={confirmApproval}
          onCancel={() => {
            setShowSkillSelector(false);
            setPendingApproval(null);
          }}
          prefilterSubject={pendingApproval.subject}
          prefilterGrade={pendingApproval.gradeLevel}
          title={
            pendingApproval.itemIds.length === 1
              ? 'Select Skill for Question'
              : `Select Skill for ${pendingApproval.itemIds.length} Questions`
          }
          description={
            pendingApproval.itemIds.length === 1
              ? 'Choose the skill this question should be linked to'
              : 'All selected questions will be linked to this skill'
          }
        />
      )}

      <div className="container mx-auto px-4 py-8">
        {feedback ? <FeedbackBanner variant={feedback.variant} message={feedback.message} className="mb-6" /> : null}

        <PageHeader
          title="Content Library"
          description="Review and approve educational content from trusted sources"
          icon={BookOpen}
          stats={statsArray}
          actions={
            <>
              <Button
                onClick={fetchContent}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              {selectedItems.size > 0 && (
                <Button
                  onClick={handleBulkApprove}
                  className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve Selected ({selectedItems.size})
                </Button>
              )}
            </>
          }
        />

        {/* Filters and Search */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
                <Button
                  key={status}
                  onClick={() => setFilter(status)}
                  variant={filter === status ? 'default' : 'outline'}
                  size="sm"
                  className={
                    filter === status
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                      : ''
                  }
                >
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                  {stats[status] ? ` (${stats[status]})` : ''}
                </Button>
              ))}
            </div>
          </div>

          {/* Select All */}
          {content.length > 0 && filter === 'PENDING' && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedItems.size === content.length}
                  onChange={selectAll}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Select all ({content.length} items)
                </span>
              </label>
            </div>
          )}
        </Card>

        {/* Content List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">Loading content...</p>
            </div>
          </div>
        ) : filteredContent.length === 0 ? (
          <Card className="p-12 text-center">
            <Sparkles className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
              No content found
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              {filter === 'PENDING'
                ? 'All content has been reviewed!'
                : `No ${filter.toLowerCase()} content available`}
            </p>
            <Button
              onClick={() => setFilter('ALL')}
              variant="outline"
            >
              View All Content
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredContent.map((item) => {
              const StatusIcon = statusConfig[item.reviewStatus as keyof typeof statusConfig]?.icon || Clock;
              const statusStyle = statusConfig[item.reviewStatus as keyof typeof statusConfig]?.color || '';

              return (
                <Card
                  key={item.id}
                  className="p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    {item.reviewStatus === 'PENDING' && (
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleSelection(item.id)}
                        className="mt-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    )}

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                            {item.questionText}
                          </h3>
                          {item.questionTextFA && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 font-vazirmatn" dir="rtl">
                              {item.questionTextFA}
                            </p>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusStyle}`}>
                          <StatusIcon className="inline h-3 w-3 mr-1" />
                          {statusConfig[item.reviewStatus as keyof typeof statusConfig]?.label}
                        </span>
                      </div>

                      {/* Metadata */}
                      <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400 mb-4">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          {item.source.name}
                        </span>
                        {item.subjectCode && (
                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
                            {item.subjectCode}
                          </span>
                        )}
                        {item.gradeLevel && (
                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
                            Grade {item.gradeLevel}
                          </span>
                        )}
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
                          {item.questionType.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Actions */}
                      {item.reviewStatus === 'PENDING' && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleApprove(item.id)}
                            size="sm"
                            className="bg-gradient-to-r from-emerald-500 to-teal-600"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => {
                              setRejectingItemId(item.id);
                              setRejectionReason('');
                            }}
                            size="sm"
                            variant="outline"
                            className="border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && total > 20 && (
          <div className="flex justify-center gap-2 mt-8">
            <Button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              variant="outline"
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-sm text-slate-600 dark:text-slate-400">
              Page {page} of {Math.ceil(total / 20)}
            </span>
            <Button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(total / 20)}
              variant="outline"
            >
              Next
            </Button>
          </div>
        )}

        <Dialog open={Boolean(rejectingItemId)} onOpenChange={(open) => !open && setRejectingItemId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRTL ? 'رد محتوا' : 'Reject content'}</DialogTitle>
              <DialogDescription>
                {isRTL
                  ? 'دلیل رد شدن را برای گردش‌کار بازبینی ثبت کنید.'
                  : 'Record a rejection reason so the review workflow stays clear.'}
              </DialogDescription>
            </DialogHeader>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              placeholder={isRTL ? 'مثلاً: پرسش نیاز به بازنویسی دارد.' : 'For example: this question needs rewriting.'}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectingItemId(null)} disabled={isSubmitting}>
                {isRTL ? 'انصراف' : 'Cancel'}
              </Button>
              <Button onClick={handleReject} disabled={isSubmitting || !rejectionReason.trim()}>
                {isSubmitting ? (isRTL ? 'در حال ثبت...' : 'Submitting...') : isRTL ? 'تایید رد' : 'Confirm rejection'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
