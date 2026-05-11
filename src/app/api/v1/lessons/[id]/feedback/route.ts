/**
 * Student Lesson Feedback API
 * GET  /api/v1/lessons/[id]/feedback  — aggregated feedback stats for a lesson
 * POST /api/v1/lessons/[id]/feedback  — submit emoji reaction + optional comment
 *
 * Stored in data/lesson-feedback.json (no migration needed)
 */
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const FEEDBACK_FILE = path.join(process.cwd(), 'data', 'lesson-feedback.json');

export type EmojiReaction = 'love' | 'happy' | 'neutral' | 'confused' | 'sad';

interface FeedbackEntry {
  id: string;
  lessonId: string;
  userId: string;
  reaction: EmojiReaction;
  comment?: string;
  createdAt: string;
}

function readStore(): FeedbackEntry[] {
  try {
    if (!fs.existsSync(FEEDBACK_FILE)) return [];
    return JSON.parse(fs.readFileSync(FEEDBACK_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function writeStore(entries: FeedbackEntry[]) {
  const dir = path.dirname(FEEDBACK_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(entries, null, 2));
}

const REACTION_SCORES: Record<EmojiReaction, number> = {
  love: 5,
  happy: 4,
  neutral: 3,
  confused: 2,
  sad: 1,
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const all = readStore();
  const entries = all.filter((e) => e.lessonId === params.id);

  const counts: Record<EmojiReaction, number> = { love: 0, happy: 0, neutral: 0, confused: 0, sad: 0 };
  let totalScore = 0;
  for (const e of entries) {
    counts[e.reaction] = (counts[e.reaction] || 0) + 1;
    totalScore += REACTION_SCORES[e.reaction] ?? 3;
  }

  const avgScore = entries.length > 0 ? totalScore / entries.length : 0;

  return NextResponse.json({
    lessonId: params.id,
    totalResponses: entries.length,
    avgScore: Math.round(avgScore * 10) / 10,
    counts,
    recentComments: entries
      .filter((e) => e.comment?.trim())
      .slice(-5)
      .map((e) => ({ comment: e.comment!, reaction: e.reaction, createdAt: e.createdAt })),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = req.headers.get('x-user-id') || req.headers.get('x-demo-user-id') || 'anonymous';
    const body = await req.json();
    const { reaction, comment } = body as { reaction: EmojiReaction; comment?: string };

    const validReactions: EmojiReaction[] = ['love', 'happy', 'neutral', 'confused', 'sad'];
    if (!validReactions.includes(reaction)) {
      return NextResponse.json({ error: 'Invalid reaction' }, { status: 400 });
    }

    const all = readStore();

    // Upsert — one feedback per user per lesson
    const existingIdx = all.findIndex((e) => e.lessonId === params.id && e.userId === userId);
    const entry: FeedbackEntry = {
      id: `${params.id}-${userId}`,
      lessonId: params.id,
      userId,
      reaction,
      comment: comment?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      all[existingIdx] = entry;
    } else {
      all.push(entry);
    }

    writeStore(all);

    return NextResponse.json({ success: true, reaction, lessonId: params.id });
  } catch (error) {
    console.error('Feedback POST error:', error);
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
  }
}
