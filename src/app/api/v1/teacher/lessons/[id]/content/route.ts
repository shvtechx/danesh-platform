/**
 * Teacher Lesson Content API
 *
 * PUT  /api/v1/teacher/lessons/[id]/content — save or publish lesson content
 * GET  /api/v1/teacher/lessons/[id]/content — read existing content for a lesson
 */
import { NextRequest, NextResponse } from 'next/server';
import { RoleName } from '@prisma/client';
import prisma from '@/lib/db';
import { getDemoUserById } from '@/lib/auth/demo-users';
import { extractSafeEmbedConfig, normalizeExternalEmbedUrl } from '@/lib/content/embed-utils';

const teacherRoleNames = [RoleName.SUPPORT_TEACHER, RoleName.TUTOR, RoleName.COUNSELOR];

async function resolveTeacher(requestUserId: string | null) {
  if (!requestUserId) return null;
  const dbTeacher = await prisma.user.findFirst({
    where: {
      id: requestUserId,
      userRoles: { some: { role: { name: { in: teacherRoleNames } } } },
    },
    select: { id: true },
  });
  if (dbTeacher) return dbTeacher;
  const demo = getDemoUserById(requestUserId);
  if (demo?.roles?.includes('TEACHER')) return { id: requestUserId };
  return null;
}

// GET — read existing content blocks for a lesson
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lessonContent = await prisma.lessonContent.findMany({
      where: { lessonId: params.id },
      include: { contentItem: true },
      orderBy: { sequence: 'asc' },
    });

    // Reverse-map DB modality back to UI content type
    const modalityToUIType: Record<string, string> = {
      TEXT: 'text',
      VIDEO: 'video',
      AUDIO: 'audio',
      MULTIMODAL: 'image',
      INTERACTIVE: 'quiz',
    };

    return NextResponse.json({
      blocks: lessonContent.map((lc) => ({
        id: lc.contentItem.id,
        sequence: lc.sequence,
        type:
          lc.contentItem.type === 'SIMULATION'
            ? 'simulation'
            : modalityToUIType[lc.contentItem.modality ?? 'TEXT'] ?? 'text',
        title: lc.contentItem.title,
        content: lc.contentItem.body || '',
        contentFA: lc.contentItem.bodyFA || '',
        metadata: lc.contentItem.metadata,
      })),
    });
  } catch (error) {
    console.error('GET lesson content error:', error);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}

// PUT — upsert lesson content and optionally publish the lesson
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id') || request.headers.get('x-demo-user-id');
    const teacher = await resolveTeacher(userId);
    if (!teacher) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { blocks, publish, lessonTitle, lessonTitleFA, estimatedTime } = body as {
      blocks: Array<{ type: string; content: string; title?: string }>;
      publish?: boolean;
      lessonTitle?: string;
      lessonTitleFA?: string;
      estimatedTime?: number;
    };

    // Verify lesson exists
    const lesson = await prisma.lesson.findUnique({ where: { id: params.id } });
    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Modality map
    const modalityMap: Record<string, 'TEXT' | 'VIDEO' | 'AUDIO' | 'INTERACTIVE' | 'MULTIMODAL'> = {
      text: 'TEXT',
      video: 'VIDEO',
      image: 'MULTIMODAL',
      audio: 'AUDIO',
      activity: 'INTERACTIVE',
      quiz: 'INTERACTIVE',
      simulation: 'INTERACTIVE',
    };

    // ContentType enum: TEXT | VIDEO | INTERACTIVE | SIMULATION | QUIZ | DISCUSSION | PROJECT
    const contentTypeMap: Record<string, 'TEXT' | 'VIDEO' | 'INTERACTIVE' | 'SIMULATION' | 'QUIZ' | 'DISCUSSION' | 'PROJECT'> = {
      text: 'TEXT',
      video: 'VIDEO',
      image: 'TEXT',
      audio: 'TEXT',
      activity: 'INTERACTIVE',
      quiz: 'QUIZ',
      simulation: 'SIMULATION',
    };

    // Delete existing LessonContent links (replace strategy)
    const existingLinks = await prisma.lessonContent.findMany({
      where: { lessonId: params.id },
      select: { id: true, contentItemId: true },
    });
    if (existingLinks.length > 0) {
      await prisma.lessonContent.deleteMany({ where: { lessonId: params.id } });
      // Optionally delete orphaned content items
      await prisma.contentItem.deleteMany({
        where: { id: { in: existingLinks.map((l) => l.contentItemId) } },
      });
    }

    // Create new ContentItem + LessonContent for each block
    const createdBlocks: Array<{ id: string; sequence: number }> = [];
    for (let i = 0; i < (blocks || []).length; i++) {
      const block = blocks[i];
      if (!block.content?.trim()) continue;

      const simulationEmbed = block.type === 'simulation'
        ? extractSafeEmbedConfig(block.content)
        : null;

      if (block.type === 'simulation' && !simulationEmbed?.embedUrl) {
        return NextResponse.json(
          {
            error: `Simulation block ${i + 1} must contain a valid iframe embed code or URL.`,
          },
          { status: 400 },
        );
      }

      const normalizedVideoUrl = block.type === 'video'
        ? normalizeExternalEmbedUrl(block.content)
        : null;

      const contentItem = await prisma.contentItem.create({
        data: {
          type: contentTypeMap[block.type] ?? 'TEXT',
          title: block.title || `Block ${i + 1}`,
          language: 'EN',
          modality: modalityMap[block.type] ?? 'TEXT',
          body: block.content,
          metadata: block.type === 'video'
            ? { url: block.content, embedUrl: normalizedVideoUrl || block.content }
            : block.type === 'image'
            ? { imageUrl: block.content }
            : block.type === 'simulation'
            ? {
                embedUrl: simulationEmbed?.embedUrl,
                embedHtml: simulationEmbed?.normalizedHtml,
                provider: simulationEmbed?.provider,
                sourceType: simulationEmbed?.sourceType,
                title: simulationEmbed?.title || block.title || `Simulation ${i + 1}`,
              }
            : undefined,
        },
      });

      await prisma.lessonContent.create({
        data: {
          lessonId: params.id,
          contentItemId: contentItem.id,
          sequence: i + 1,
        },
      });

      createdBlocks.push({ id: contentItem.id, sequence: i + 1 });
    }

    // Update lesson metadata & optional publish
    const updateData: {
      isPublished?: boolean;
      title?: string;
      titleFA?: string | null;
      estimatedTime?: number | null;
      updatedAt: Date;
    } = { updatedAt: new Date() };

    if (publish) updateData.isPublished = true;
    if (lessonTitle?.trim()) updateData.title = lessonTitle.trim();
    if (lessonTitleFA !== undefined) updateData.titleFA = lessonTitleFA?.trim() || null;
    if (estimatedTime !== undefined) updateData.estimatedTime = estimatedTime || null;

    const updatedLesson = await prisma.lesson.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      lessonId: params.id,
      isPublished: updatedLesson.isPublished,
      savedBlocks: createdBlocks.length,
    });
  } catch (error) {
    console.error('PUT lesson content error:', error);
    return NextResponse.json({ error: 'Failed to save content' }, { status: 500 });
  }
}
