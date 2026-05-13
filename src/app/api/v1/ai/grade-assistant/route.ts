import { NextRequest, NextResponse } from 'next/server';
import { resolveRequestUserId } from '@/lib/auth/request-user';
import { generateGradingAssistantSuggestion, isAIGradingConfigured } from '@/lib/ai/grading-assistant';

export async function POST(request: NextRequest) {
  try {
    const userId = resolveRequestUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'User is required' }, { status: 401 });
    }

    const body = await request.json();
    const question = body?.question;
    const response = body?.response;
    const locale = typeof body?.locale === 'string' ? body.locale : 'en';

    if (!question || response === undefined) {
      return NextResponse.json({ error: 'question and response are required' }, { status: 400 });
    }

    const result = await generateGradingAssistantSuggestion({
      question,
      response,
      locale,
    });

    return NextResponse.json({
      configured: isAIGradingConfigured(),
      ...result,
    });
  } catch (error) {
    console.error('Error generating grading assistant suggestion:', error);
    return NextResponse.json({ error: 'Failed to generate grading suggestion' }, { status: 500 });
  }
}
