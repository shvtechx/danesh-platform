'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { PageHeader } from '@/components/admin/PageHeader';
import {
  Database,
  Play,
  RefreshCw,
  Globe,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Calendar,
} from 'lucide-react';

interface ContentSource {
  id: string;
  name: string;
  nameFA: string;
  url: string;
  description?: string;
  isActive: boolean;
  lastScrapedAt?: string;
  totalItemsScraped: number;
  successRate?: number;
  _count?: {
    scrapedContent: number;
  };
}

interface ImportJob {
  id: string;
  status: string;
  jobType: string;
  itemsProcessed: number;
  itemsSucceeded: number;
  itemsFailed: number;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
  source: {
    name: string;
  };
}

const jobStatusConfig = {
  PENDING: { label: 'Pending', color: 'bg-slate-100 text-slate-800 border-slate-200', icon: Clock },
  RUNNING: { label: 'Running', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: RefreshCw },
  COMPLETED: { label: 'Completed', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle },
  FAILED: { label: 'Failed', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-slate-100 text-slate-800 border-slate-200', icon: XCircle },
};

export default function ContentSourcesPage() {
  const params = useParams();
  const t = useTranslations();
  const locale = params.locale as string;

  const [sources, setSources] = useState<ContentSource[]>([]);
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [maxItemsInput, setMaxItemsInput] = useState('50');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [feedback, setFeedback] = useState<{ variant: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [initializing, setInitializing] = useState(false);
  const [runningImport, setRunningImport] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [sourcesRes, jobsRes] = await Promise.all([
        fetch('/api/v1/admin/scraper/sources'),
        fetch('/api/v1/admin/scraper/run'),
      ]);

      if (sourcesRes.ok) {
        const sourcesData = await sourcesRes.json();
        setSources(sourcesData.sources || []);
      }

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setJobs(jobsData.jobs || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setFeedback({ variant: 'error', message: 'Failed to load content sources and import jobs.' });
    } finally {
      setLoading(false);
    }
  };

  const initializeSources = async () => {
    try {
      setInitializing(true);
      const res = await fetch('/api/v1/admin/scraper/sources', {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to initialize');

      setFeedback({ variant: 'success', message: 'Sources initialized successfully.' });
      fetchData();
    } catch (error) {
      console.error('Error initializing:', error);
      setFeedback({ variant: 'error', message: 'Failed to initialize sources.' });
    } finally {
      setInitializing(false);
    }
  };

  const runImport = async () => {
    if (!selectedSource) return;

    try {
      setRunningImport(true);
      const res = await fetch('/api/v1/admin/scraper/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: selectedSource,
          jobType: 'FULL_SCRAPE',
          maxItems: parseInt(maxItemsInput, 10),
        }),
      });

      if (!res.ok) throw new Error('Failed to start import');

      setFeedback({ variant: 'success', message: 'Import job started successfully.' });
      setShowImportDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error starting import:', error);
      setFeedback({ variant: 'error', message: 'Failed to start import job.' });
    } finally {
      setRunningImport(false);
    }
  };

  const totalItemsImported = sources.reduce((sum, s) => sum + s.totalItemsScraped, 0);
  const activeJobs = jobs.filter((j) => j.status === 'RUNNING').length;
  const completedJobs = jobs.filter((j) => j.status === 'COMPLETED').length;
  const activeSources = sources.filter((s) => s.isActive).length;

  const statsArray = [
    {
      label: 'Active Sources',
      value: activeSources,
      icon: Globe,
      color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400',
    },
    {
      label: 'Total Items Imported',
      value: totalItemsImported,
      icon: Database,
      color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400',
    },
    {
      label: 'Active Jobs',
      value: activeJobs,
      icon: RefreshCw,
      color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400',
    },
    {
      label: 'Completed Jobs',
      value: completedJobs,
      icon: CheckCircle,
      color: 'bg-teal-50 text-teal-600 dark:bg-teal-950/20 dark:text-teal-400',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        {feedback ? <FeedbackBanner variant={feedback.variant} message={feedback.message} className="mb-6" /> : null}

        <PageHeader
          title="Content Sources"
          description="Manage educational content sources and import jobs"
          icon={Database}
          stats={statsArray}
          actions={
            <>
              <Button
                onClick={fetchData}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              {sources.length === 0 && (
                <Button
                  onClick={initializeSources}
                  disabled={initializing}
                  className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600"
                >
                  <Play className="h-4 w-4" />
                  {initializing ? 'Initializing...' : 'Initialize Sources'}
                </Button>
              )}
            </>
          }
        />

        {/* Sources Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Educational Platforms
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
          ) : sources.length === 0 ? (
            <Card className="p-12 text-center">
              <Database className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
                No sources configured
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Click "Initialize Sources" to add trusted educational platforms
              </p>
              <Button
                onClick={initializeSources}
                disabled={initializing}
                className="bg-gradient-to-r from-emerald-500 to-teal-600"
              >
                <Play className="h-4 w-4 mr-2" />
                {initializing ? 'Initializing...' : 'Initialize Sources'}
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sources.map((source) => (
                <Card
                  key={source.id}
                  className="p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                        {source.name}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400" dir="rtl">
                        {source.nameFA}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        source.isActive
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {source.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {source.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      {source.description}
                    </p>
                  )}

                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline mb-4 block"
                  >
                    <Globe className="inline h-3 w-3 mr-1" />
                    {source.url}
                  </a>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                        Items Imported
                      </p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {source.totalItemsScraped}
                      </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                        Success Rate
                      </p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {source.successRate?.toFixed(0) || 0}%
                      </p>
                    </div>
                  </div>

                  {source.lastScrapedAt && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                      <Calendar className="inline h-3 w-3 mr-1" />
                      Last imported: {new Date(source.lastScrapedAt).toLocaleDateString()}
                    </p>
                  )}

                  <Button
                    onClick={() => {
                      setSelectedSource(source.id);
                      setMaxItemsInput('50');
                      setShowImportDialog(true);
                    }}
                    disabled={!source.isActive}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600"
                    size="sm"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Start Import
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recent Jobs */}
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Recent Import Jobs
          </h2>

          {jobs.length === 0 ? (
            <Card className="p-8 text-center">
              <Clock className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">
                No import jobs yet. Start an import above to see activity.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {jobs.slice(0, 10).map((job) => {
                const StatusIcon = jobStatusConfig[job.status as keyof typeof jobStatusConfig]?.icon || Clock;
                const statusStyle = jobStatusConfig[job.status as keyof typeof jobStatusConfig]?.color || '';

                return (
                  <Card
                    key={job.id}
                    className="p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusStyle}`}>
                          <StatusIcon className="inline h-3 w-3 mr-1" />
                          {jobStatusConfig[job.status as keyof typeof jobStatusConfig]?.label}
                        </span>

                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900 dark:text-white">
                            {job.source.name}
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {job.jobType.replace('_', ' ')}
                          </p>
                        </div>

                        {job.status === 'COMPLETED' && (
                          <div className="flex gap-6 text-sm">
                            <div>
                              <span className="text-slate-500 dark:text-slate-400">Processed:</span>
                              <span className="font-semibold text-slate-900 dark:text-white ml-1">
                                {job.itemsProcessed}
                              </span>
                            </div>
                            <div>
                              <span className="text-emerald-600 dark:text-emerald-400">Succeeded:</span>
                              <span className="font-semibold ml-1">{job.itemsSucceeded}</span>
                            </div>
                            {job.itemsFailed > 0 && (
                              <div>
                                <span className="text-red-600 dark:text-red-400">Failed:</span>
                                <span className="font-semibold ml-1">{job.itemsFailed}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {job.status === 'FAILED' && job.errorMessage && (
                          <p className="text-sm text-red-600 dark:text-red-400">
                            {job.errorMessage}
                          </p>
                        )}
                      </div>

                      <div className="text-right text-sm text-slate-500 dark:text-slate-400">
                        <p>{new Date(job.createdAt).toLocaleString()}</p>
                        {job.completedAt && (
                          <p className="text-xs">
                            Completed: {new Date(job.completedAt).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start import job</DialogTitle>
              <DialogDescription>
                Choose the batch size for this import. Smaller batches keep the workflow smoother and easier to review.
              </DialogDescription>
            </DialogHeader>
            <Input
              type="number"
              min={1}
              max={500}
              label="Maximum items"
              value={maxItemsInput}
              onChange={(e) => setMaxItemsInput(e.target.value)}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowImportDialog(false)} disabled={runningImport}>
                Cancel
              </Button>
              <Button
                onClick={runImport}
                disabled={runningImport || !selectedSource || !maxItemsInput || parseInt(maxItemsInput, 10) <= 0}
              >
                {runningImport ? 'Starting...' : 'Start import'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
