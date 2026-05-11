import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const createSubjectSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  nameFA: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  description: z.string().optional(),
});

const updateSubjectSchema = z.object({
  name: z.string().min(2).optional(),
  nameFA: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  description: z.string().optional(),
});

/**
 * GET /api/v1/admin/subjects
 * Retrieve all subjects from database
 */
export async function GET() {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            courses: true,
            strands: true
          }
        }
      }
    });
    
    return NextResponse.json({ subjects });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 });
  }
}

/**
 * POST /api/v1/admin/subjects
 * Create a new subject in database
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createSubjectSchema.parse(body);
    
    // Check if subject with this code already exists
    const existing = await prisma.subject.findUnique({
      where: { code: data.code }
    });
    
    if (existing) {
      return NextResponse.json(
        { error: 'A subject with this code already exists' }, 
        { status: 409 }
      );
    }
    
    const subject = await prisma.subject.create({
      data: {
        code: data.code,
        name: data.name,
        nameFA: data.nameFA,
        icon: data.icon,
        color: data.color,
        description: data.description
      }
    });
    
    return NextResponse.json({ subject }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }

    console.error('Error creating subject:', error);
    return NextResponse.json({ error: 'Failed to create subject' }, { status: 500 });
  }
}

/**
 * PATCH /api/v1/admin/subjects
 * Update an existing subject
 */
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Subject id is required' }, { status: 400 });
    }
    
    const body = await request.json();
    const data = updateSubjectSchema.parse(body);
    
    const subject = await prisma.subject.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.nameFA && { nameFA: data.nameFA }),
        ...(data.icon && { icon: data.icon }),
        ...(data.color && { color: data.color }),
        ...(data.description && { description: data.description })
      }
    });
    
    return NextResponse.json({ subject });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }

    console.error('Error updating subject:', error);
    return NextResponse.json({ error: 'Failed to update subject' }, { status: 500 });
  }
}

/**
 * DELETE /api/v1/admin/subjects
 * Delete a subject from database
 */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Subject id is required' }, { status: 400 });
  }

  try {
    // Check if subject has associated courses
    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        _count: {
          select: { courses: true }
        }
      }
    });
    
    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }
    
    if (subject._count.courses > 0) {
      return NextResponse.json(
        { error: 'Cannot delete subject with existing courses' },
        { status: 400 }
      );
    }
    
    await prisma.subject.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting subject:', error);
    return NextResponse.json({ error: 'Failed to delete subject' }, { status: 500 });
  }
}
