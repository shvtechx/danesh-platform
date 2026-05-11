'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, AlertCircle } from 'lucide-react';

interface Assessment {
  id: string;
  title: string;
  description?: string;
  courseId: string;
  lessonId?: string;
  timeLimit?: number;
  totalPoints: number;
  passingScore: number;
}

export default function AssessmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations();
  const locale = params.locale as string;
  const id = params.id as string;

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAssessment();
  }, [id]);

  const fetchAssessment = async () => {
    try {
      const response = await fetch(`/api/v1/assessments/${id}`);
      if (!response.ok) throw new Error('Assessment not found');
      const data = await response.json();
      setAssessment(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  const startAssessment = () => {
    router.push(`/${locale}/assessments/${id}/take`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading assessment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center max-w-2xl mx-auto">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Assessment Not Found</h2>
          <p className="text-slate-600 mb-6">
            The assessment you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => router.push(`/${locale}/assessments`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assessments
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Assessment Info */}
        <Card className="p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">{assessment.title}</h1>
            {assessment.description && (
              <p className="text-slate-600">{assessment.description}</p>
            )}
          </div>

          {/* Assessment Details */}
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            {assessment.timeLimit && (
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <Clock className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-sm text-slate-500">Time Limit</p>
                  <p className="font-semibold">{assessment.timeLimit} minutes</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
              <div className="h-5 w-5 text-emerald-600 font-bold">Pts</div>
              <div>
                <p className="text-sm text-slate-500">Total Points</p>
                <p className="font-semibold">{assessment.totalPoints}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
              <div className="h-5 w-5 text-emerald-600 font-bold">%</div>
              <div>
                <p className="text-sm text-slate-500">Passing Score</p>
                <p className="font-semibold">{assessment.passingScore}%</p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold mb-3 text-blue-900">Instructions</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Read each question carefully before answering</li>
              <li>• You can review and change your answers before submitting</li>
              {assessment.timeLimit && (
                <li>• The assessment will auto-submit when time runs out</li>
              )}
              <li>• Make sure you have a stable internet connection</li>
            </ul>
          </div>

          {/* Start Button */}
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={startAssessment}
              className="px-8"
            >
              Start Assessment
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
