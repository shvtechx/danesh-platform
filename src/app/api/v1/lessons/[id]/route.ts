import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/v1/lessons/:id
 * Retrieve a single lesson with all content and assessments
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: params.id },
      include: {
        unit: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                titleFA: true
              }
            }
          }
        },
        contentItems: {
          include: {
            contentItem: true
          },
          orderBy: { sequence: 'asc' }
        },
        assessments: {
          include: {
            assessment: {
              include: {
                questions: {
                  include: {
                    question: {
                      include: {
                        options: true
                      }
                    }
                  },
                  orderBy: { sequence: 'asc' }
                }
              }
            }
          },
          orderBy: { sequence: 'asc' }
        }
      }
    });

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ lesson });
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lesson' },
      { status: 500 }
    );
  }
}
