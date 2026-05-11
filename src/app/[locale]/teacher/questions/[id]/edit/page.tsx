'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Trash2, Plus, X } from 'lucide-react';
import { FeedbackBanner } from '@/components/ui/feedback-banner';

interface QuestionOption {
  id?: string;
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
  };
}

export default function EditQuestionPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const isRTL = locale === 'fa';
  const questionId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [feedback, setFeedback] = useState<{ variant: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Form fields
  const [stem, setStem] = useState('');
  const [stemFA, setStemFA] = useState('');
  const [explanation, setExplanation] = useState('');
  const [explanationFA, setExplanationFA] = useState('');
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'>('MEDIUM');
  const [bloomLevel, setBloomLevel] = useState('UNDERSTAND');
  const [questionType, setQuestionType] = useState('MULTIPLE_CHOICE');
  const [phase5E, setPhase5E] = useState('5E_EXPLAIN');
  const [subjectCode, setSubjectCode] = useState('MATH');
  const [options, setOptions] = useState<QuestionOption[]>([]);

  useEffect(() => {
    loadQuestion();
  }, [questionId]);

  const loadQuestion = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/questions/${questionId}`);
      const data = await res.json();

      if (res.ok) {
        setQuestion(data);
        setStem(data.stem || '');
        setStemFA(data.stemFA || '');
        setExplanation(data.explanation || '');
        setExplanationFA(data.explanationFA || '');
        setDifficulty(data.difficulty || 'MEDIUM');
        setBloomLevel(data.bloomLevel || 'UNDERSTAND');
        setQuestionType(data.type || 'MULTIPLE_CHOICE');
        setPhase5E(data.metadata?.phase5E || '5E_EXPLAIN');
        setSubjectCode(data.metadata?.subjectCode || 'MATH');
        setOptions(data.options || []);
      }
    } catch (error) {
      console.error('Error loading question:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setFeedback(null);

      const payload = {
        stem,
        stemFA,
        explanation,
        explanationFA,
        difficulty,
        bloomLevel,
        type: questionType,
        metadata: {
          phase5E,
          subjectCode
        },
        options: options.map((opt, idx) => ({
          text: opt.text,
          textFA: opt.textFA,
          isCorrect: opt.isCorrect,
          feedback: opt.feedback || '',
          feedbackFA: opt.feedbackFA || '',
          order: idx
        }))
      };

      const res = await fetch(`/api/v1/questions/${questionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setFeedback({
          variant: 'success',
          message: isRTL ? 'سوال با موفقیت ذخیره شد.' : 'Question saved successfully.',
        });
        window.setTimeout(() => {
          router.push(`/${locale}/teacher/questions`);
        }, 500);
      } else {
        setFeedback({
          variant: 'error',
          message: isRTL ? 'خطا در ذخیره سوال' : 'Error saving question',
        });
      }
    } catch (error) {
      console.error('Error saving question:', error);
      setFeedback({
        variant: 'error',
        message: isRTL ? 'خطا در ذخیره سوال' : 'Error saving question',
      });
    } finally {
      setSaving(false);
    }
  };

  const addOption = () => {
    setOptions([
      ...options,
      {
        text: '',
        textFA: '',
        isCorrect: false,
        feedback: '',
        feedbackFA: '',
        order: options.length
      }
    ]);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, field: keyof QuestionOption, value: any) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{isRTL ? 'در حال بارگذاری...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-200 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isRTL ? 'ویرایش سوال' : 'Edit Question'}
              </h1>
              <p className="text-gray-600">
                {isRTL ? `شناسه: ${questionId}` : `ID: ${questionId}`}
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            <Save className="w-5 h-5" />
            {saving ? (isRTL ? 'در حال ذخیره...' : 'Saving...') : (isRTL ? 'ذخیره تغییرات' : 'Save Changes')}
          </button>
        </div>

        {feedback ? (
          <FeedbackBanner className="mb-6" variant={feedback.variant} message={feedback.message} />
        ) : null}

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Question Stem */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Stem (English)
              </label>
              <textarea
                value={stem}
                onChange={(e) => setStem(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Enter question text in English..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                متن سوال (فارسی)
              </label>
              <textarea
                value={stemFA}
                onChange={(e) => setStemFA(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 text-right"
                placeholder="متن سوال را به فارسی وارد کنید..."
                dir="rtl"
              />
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isRTL ? 'سطح سختی' : 'Difficulty'}
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
                <option value="EXPERT">Expert</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isRTL ? 'سطح بلوم' : "Bloom's Level"}
              </label>
              <select
                value={bloomLevel}
                onChange={(e) => setBloomLevel(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="REMEMBER">Remember</option>
                <option value="UNDERSTAND">Understand</option>
                <option value="APPLY">Apply</option>
                <option value="ANALYZE">Analyze</option>
                <option value="EVALUATE">Evaluate</option>
                <option value="CREATE">Create</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isRTL ? 'فاز 5E' : '5E Phase'}
              </label>
              <select
                value={phase5E}
                onChange={(e) => setPhase5E(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="5E_ENGAGE">Engage</option>
                <option value="5E_EXPLORE">Explore</option>
                <option value="5E_EXPLAIN">Explain</option>
                <option value="5E_ELABORATE">Elaborate</option>
                <option value="5E_EVALUATE">Evaluate</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isRTL ? 'موضوع' : 'Subject'}
              </label>
              <select
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="MATH">Math</option>
                <option value="SCI">Science</option>
                <option value="ENG">English</option>
                <option value="PER">Persian</option>
                <option value="SOC">Social Studies</option>
                <option value="COMP">Computer Science</option>
                <option value="ROBOT">Robotics</option>
                <option value="AI">AI</option>
                <option value="ENTRE">Entrepreneurship</option>
              </select>
            </div>
          </div>

          {/* Answer Options */}
          {questionType === 'MULTIPLE_CHOICE' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isRTL ? 'گزینه‌های پاسخ' : 'Answer Options'}
                </h3>
                <button
                  onClick={addOption}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  {isRTL ? 'افزودن گزینه' : 'Add Option'}
                </button>
              </div>

              <div className="space-y-4">
                {options.map((option, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={option.isCorrect}
                          onChange={(e) => updateOption(index, 'isCorrect', e.target.checked)}
                          className="w-4 h-4 text-green-600"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {isRTL ? 'پاسخ صحیح' : 'Correct Answer'}
                        </span>
                      </label>
                      <button
                        onClick={() => removeOption(index)}
                        className="text-red-600 hover:text-red-800 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => updateOption(index, 'text', e.target.value)}
                        placeholder="Option text (English)"
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={option.textFA}
                        onChange={(e) => updateOption(index, 'textFA', e.target.value)}
                        placeholder="متن گزینه (فارسی)"
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 text-right"
                        dir="rtl"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Explanation */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Explanation (English)
              </label>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Explain the correct answer..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                توضیح (فارسی)
              </label>
              <textarea
                value={explanationFA}
                onChange={(e) => setExplanationFA(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 text-right"
                placeholder="پاسخ صحیح را توضیح دهید..."
                dir="rtl"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
