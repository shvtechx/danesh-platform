type QuestionLike = {
  id: string;
  type?: string | null;
  points?: number | null;
  bloomLevel?: string | null;
  metadata?: unknown;
};

type RubricCriterion = {
  id: string;
  label: string;
  description: string;
  maxPoints: number;
};

export type CriticalThinkingDimension =
  | 'INTERPRETATION'
  | 'ANALYSIS'
  | 'EVIDENCE_USE'
  | 'REASONING'
  | 'EVALUATION'
  | 'PROBLEM_SOLVING'
  | 'COMMUNICATION'
  | 'REFLECTION';

export type AISuggestion = {
  suggestedScore: number;
  maxScore: number;
  percentage: number;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  rationale: string;
  strengths: string[];
  improvements: string[];
  dimensions: CriticalThinkingDimension[];
  rubricBreakdown: Array<{
    criterionId: string;
    label: string;
    score: number;
    maxPoints: number;
    rationale: string;
  }>;
};

const EN_EVIDENCE_MARKERS = ['because', 'therefore', 'for example', 'evidence', 'data', 'according to', 'as a result'];
const FA_EVIDENCE_MARKERS = ['زیرا', 'بنابراین', 'برای مثال', 'شواهد', 'داده', 'طبق', 'در نتیجه'];
const EN_REASONING_MARKERS = ['if', 'then', 'so', 'however', 'although', 'compare', 'trade-off', 'best option'];
const FA_REASONING_MARKERS = ['اگر', 'آنگاه', 'پس', 'اما', 'اگرچه', 'مقایسه', 'موازنه', 'بهترین گزینه'];
const EN_DESIGN_MARKERS = ['plan', 'design', 'improve', 'prototype', 'revise', 'constraint', 'solution'];
const FA_DESIGN_MARKERS = ['طرح', 'طراحی', 'بهبود', 'نمونه', 'بازنگری', 'محدودیت', 'راه‌حل', 'راه حل'];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function normalizeDimension(value: string): CriticalThinkingDimension | null {
  const normalized = value.trim().toUpperCase();
  const allowed: CriticalThinkingDimension[] = [
    'INTERPRETATION',
    'ANALYSIS',
    'EVIDENCE_USE',
    'REASONING',
    'EVALUATION',
    'PROBLEM_SOLVING',
    'COMMUNICATION',
    'REFLECTION',
  ];

  return allowed.includes(normalized as CriticalThinkingDimension)
    ? (normalized as CriticalThinkingDimension)
    : null;
}

export function isOpenResponseQuestion(type?: string | null) {
  return type === 'SHORT_ANSWER' || type === 'LONG_ANSWER';
}

export function extractResponseText(response: unknown) {
  if (typeof response === 'string') {
    return response.trim();
  }

  if (response && typeof response === 'object') {
    const record = response as Record<string, unknown>;
    const candidates = [record.value, record.text, record.answer, record.response];
    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
    }
  }

  return '';
}

export function getCriticalThinkingDimensions(question: QuestionLike): CriticalThinkingDimension[] {
  const metadata = asRecord(question.metadata);
  const raw = asStringArray(metadata.criticalThinkingDimensions)
    .map(normalizeDimension)
    .filter((value): value is CriticalThinkingDimension => Boolean(value));

  if (raw.length > 0) {
    return Array.from(new Set(raw));
  }

  switch (question.bloomLevel) {
    case 'ANALYZE':
      return ['ANALYSIS', 'REASONING'];
    case 'EVALUATE':
      return ['EVALUATION', 'EVIDENCE_USE', 'COMMUNICATION'];
    case 'CREATE':
      return ['PROBLEM_SOLVING', 'REASONING', 'COMMUNICATION'];
    case 'APPLY':
      return ['INTERPRETATION', 'PROBLEM_SOLVING'];
    default:
      return isOpenResponseQuestion(question.type) ? ['COMMUNICATION', 'REASONING'] : ['INTERPRETATION'];
  }
}

export function getRubricCriteria(question: QuestionLike): RubricCriterion[] {
  const metadata = asRecord(question.metadata);
  const rawCriteria: unknown[] = Array.isArray(metadata.rubricCriteria)
    ? (metadata.rubricCriteria as unknown[])
    : Array.isArray(asRecord(metadata.rubric).criteria)
      ? (asRecord(metadata.rubric).criteria as unknown[])
      : [];

  const maxScore = Math.max(1, Number(question.points || 1));

  if (rawCriteria.length > 0) {
    return rawCriteria
      .map((criterion, index) => {
        const record = asRecord(criterion);
        return {
          id: String(record.id || `criterion-${index + 1}`),
          label: String(record.label || record.name || `Criterion ${index + 1}`),
          description: String(record.description || ''),
          maxPoints: Number(record.maxPoints || maxScore / rawCriteria.length),
        };
      })
      .filter((criterion) => criterion.maxPoints > 0);
  }

  const defaults = [
    { id: 'understanding', label: 'Understanding', description: 'Shows understanding of the problem.' },
    { id: 'evidence', label: 'Evidence', description: 'Uses relevant evidence or examples.' },
    { id: 'reasoning', label: 'Reasoning', description: 'Explains why the answer makes sense.' },
    { id: 'communication', label: 'Communication', description: 'Communicates clearly and completely.' },
  ];

  return defaults.map((criterion) => ({
    ...criterion,
    maxPoints: maxScore / defaults.length,
  }));
}

function countMatches(text: string, markers: string[]) {
  const lower = text.toLowerCase();
  return markers.reduce((count, marker) => count + (lower.includes(marker.toLowerCase()) ? 1 : 0), 0);
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function evaluateOpenResponse(question: QuestionLike, response: unknown): AISuggestion {
  const text = extractResponseText(response);
  const trimmed = text.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  const sentenceCount = trimmed ? trimmed.split(/[.!?؟]+/).filter(Boolean).length : 0;
  const evidenceHits = countMatches(trimmed, [...EN_EVIDENCE_MARKERS, ...FA_EVIDENCE_MARKERS]);
  const reasoningHits = countMatches(trimmed, [...EN_REASONING_MARKERS, ...FA_REASONING_MARKERS]);
  const designHits = countMatches(trimmed, [...EN_DESIGN_MARKERS, ...FA_DESIGN_MARKERS]);
  const criteria = getRubricCriteria(question);
  const maxScore = Number(question.points || criteria.reduce((sum, criterion) => sum + criterion.maxPoints, 0) || 1);
  const dimensions = getCriticalThinkingDimensions(question);

  if (!trimmed) {
    return {
      suggestedScore: 0,
      maxScore,
      percentage: 0,
      confidence: 'LOW',
      rationale: 'No response was provided, so the answer needs teacher review.',
      strengths: [],
      improvements: ['Add a complete written response with evidence and reasoning.'],
      dimensions,
      rubricBreakdown: criteria.map((criterion) => ({
        criterionId: criterion.id,
        label: criterion.label,
        score: 0,
        maxPoints: criterion.maxPoints,
        rationale: 'No evidence available in the response.',
      })),
    };
  }

  const completeness = clamp(wordCount / (question.type === 'LONG_ANSWER' ? 80 : 25));
  const evidenceQuality = clamp((evidenceHits + (wordCount > 35 ? 1 : 0)) / 3);
  const reasoningQuality = clamp((reasoningHits + (sentenceCount > 2 ? 1 : 0)) / 3);
  const designQuality = clamp((designHits + (dimensions.includes('PROBLEM_SOLVING') ? 1 : 0)) / 3);
  const clarityQuality = clamp((sentenceCount + (wordCount > 20 ? 1 : 0)) / 4);

  const rubricBreakdown = criteria.map((criterion) => {
    const key = criterion.label.toLowerCase();
    const quality = key.includes('evidence')
      ? evidenceQuality
      : key.includes('reason') || key.includes('analysis') || key.includes('evaluation')
        ? reasoningQuality
        : key.includes('design') || key.includes('problem')
          ? designQuality
          : key.includes('commun') || key.includes('clar')
            ? clarityQuality
            : completeness;

    const score = Math.round(quality * criterion.maxPoints * 100) / 100;
    const rationale = quality >= 0.75
      ? 'The response shows strong evidence for this criterion.'
      : quality >= 0.45
        ? 'The response partially meets this criterion but needs stronger support.'
        : 'The response needs clearer development for this criterion.';

    return {
      criterionId: criterion.id,
      label: criterion.label,
      score,
      maxPoints: criterion.maxPoints,
      rationale,
    };
  });

  const suggestedScore = Math.min(
    maxScore,
    Math.round(rubricBreakdown.reduce((sum, item) => sum + item.score, 0) * 100) / 100,
  );
  const percentage = Math.round((suggestedScore / Math.max(1, maxScore)) * 100);
  const confidence = wordCount >= 40 && (evidenceHits + reasoningHits) >= 2 ? 'HIGH' : wordCount >= 18 ? 'MEDIUM' : 'LOW';

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (evidenceHits > 0) strengths.push('Uses evidence markers to support the answer.');
  if (reasoningHits > 0) strengths.push('Shows reasoning or comparison language.');
  if (wordCount >= 25) strengths.push('Provides a sufficiently developed response.');
  if (designHits > 0) strengths.push('Suggests a practical solution or improvement.');

  if (evidenceHits === 0) improvements.push('Add specific evidence, examples, or data to support the answer.');
  if (reasoningHits === 0) improvements.push('Explain why the answer works, not just what the answer is.');
  if (wordCount < (question.type === 'LONG_ANSWER' ? 50 : 15)) improvements.push('Develop the response with more complete detail.');
  if (sentenceCount < 2) improvements.push('Organize the answer into clearer complete sentences.');

  return {
    suggestedScore,
    maxScore,
    percentage,
    confidence,
    rationale: `The draft score is based on response completeness, evidence cues, reasoning language, and rubric-aligned communication quality across ${dimensions.join(', ').toLowerCase()}.`,
    strengths,
    improvements,
    dimensions,
    rubricBreakdown,
  };
}

export function scoreToBand(percentage: number | null | undefined) {
  const value = Number(percentage ?? 0);
  if (value >= 85) return 'ADVANCED';
  if (value >= 70) return 'SECURE';
  if (value >= 50) return 'APPROACHING';
  return 'BEGINNING';
}

export function percentageFromScores(score: number, maxScore: number) {
  if (!maxScore) return 0;
  return Math.round((score / maxScore) * 100);
}
