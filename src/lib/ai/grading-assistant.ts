import OpenAI from 'openai';
import {
  evaluateOpenResponse,
  extractResponseText,
  getCriticalThinkingDimensions,
  getRubricCriteria,
  type AISuggestion,
} from '@/lib/assessment/critical-thinking';

type QuestionInput = {
  id: string;
  type?: string | null;
  points?: number | null;
  bloomLevel?: string | null;
  stem?: string | null;
  stemFA?: string | null;
  metadata?: unknown;
};

export type GradingAssistantResult = {
  provider: 'openai' | 'heuristic';
  model: string | null;
  suggestion: AISuggestion;
};

function buildFallback(question: QuestionInput, response: unknown): GradingAssistantResult {
  return {
    provider: 'heuristic',
    model: null,
    suggestion: evaluateOpenResponse(question, response),
  };
}

function clampScore(score: number, maxScore: number) {
  return Math.min(maxScore, Math.max(0, Number.isFinite(score) ? score : 0));
}

function normalizeSuggestion(candidate: any, fallback: AISuggestion): AISuggestion {
  const maxScore = Number(fallback.maxScore || 1);
  const suggestedScore = clampScore(Number(candidate?.suggestedScore), maxScore);
  const percentage = maxScore > 0 ? Math.round((suggestedScore / maxScore) * 100) : 0;
  const confidence = ['LOW', 'MEDIUM', 'HIGH'].includes(candidate?.confidence) ? candidate.confidence : fallback.confidence;

  return {
    suggestedScore,
    maxScore,
    percentage,
    confidence,
    rationale: typeof candidate?.rationale === 'string' && candidate.rationale.trim() ? candidate.rationale : fallback.rationale,
    strengths: Array.isArray(candidate?.strengths) ? candidate.strengths.filter((item: unknown): item is string => typeof item === 'string') : fallback.strengths,
    improvements: Array.isArray(candidate?.improvements) ? candidate.improvements.filter((item: unknown): item is string => typeof item === 'string') : fallback.improvements,
    dimensions: Array.isArray(candidate?.dimensions) && candidate.dimensions.length > 0 ? candidate.dimensions : fallback.dimensions,
    rubricBreakdown: Array.isArray(candidate?.rubricBreakdown) && candidate.rubricBreakdown.length > 0
      ? candidate.rubricBreakdown.map((item: any, index: number) => ({
          criterionId: String(item?.criterionId || fallback.rubricBreakdown[index]?.criterionId || `criterion-${index + 1}`),
          label: String(item?.label || fallback.rubricBreakdown[index]?.label || `Criterion ${index + 1}`),
          score: clampScore(Number(item?.score), Number(item?.maxPoints || fallback.rubricBreakdown[index]?.maxPoints || 1)),
          maxPoints: Number(item?.maxPoints || fallback.rubricBreakdown[index]?.maxPoints || 1),
          rationale: typeof item?.rationale === 'string' && item.rationale.trim() ? item.rationale : fallback.rubricBreakdown[index]?.rationale || fallback.rationale,
        }))
      : fallback.rubricBreakdown,
  };
}

export function isAIGradingConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function generateGradingAssistantSuggestion(args: {
  question: QuestionInput;
  response: unknown;
  locale?: string;
}): Promise<GradingAssistantResult> {
  const fallback = buildFallback(args.question, args.response);
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-5.4';

  if (!apiKey) {
    return fallback;
  }

  const client = new OpenAI({ apiKey });
  const promptLanguage = args.locale === 'fa' ? 'Persian' : 'English';
  const rubricCriteria = getRubricCriteria(args.question);
  const responseText = extractResponseText(args.response);
  const dimensions = getCriticalThinkingDimensions(args.question);

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content:
        'You are a teacher-facing grading assistant. Return only valid JSON with keys: suggestedScore, confidence, rationale, strengths, improvements, dimensions, rubricBreakdown. Never make the final decision for the teacher.',
    },
    {
      role: 'user',
      content: JSON.stringify({
        language: promptLanguage,
        question: {
          stem: args.question.stem,
          stemFA: args.question.stemFA,
          type: args.question.type,
          maxScore: args.question.points,
          bloomLevel: args.question.bloomLevel,
          dimensions,
          rubricCriteria,
          metadata: args.question.metadata,
        },
        studentResponse: responseText,
        instructions: [
          'Score conservatively and align to the rubric.',
          'Highlight specific strengths and next improvements.',
          'Keep rationale concise and teacher-facing.',
        ],
      }),
    },
  ];

  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.2,
      messages,
    });

    const rawContent = completion.choices[0]?.message?.content || '';
    const jsonStart = rawContent.indexOf('{');
    const jsonEnd = rawContent.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) {
      return fallback;
    }

    const parsed = JSON.parse(rawContent.slice(jsonStart, jsonEnd + 1));

    return {
      provider: 'openai',
      model,
      suggestion: normalizeSuggestion(parsed, fallback.suggestion),
    };
  } catch {
    return fallback;
  }
}
