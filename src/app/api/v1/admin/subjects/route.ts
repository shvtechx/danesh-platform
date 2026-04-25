import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createDemoSubject,
  listDemoSubjects,
  removeDemoSubject,
  updateSubjectAssignments,
} from '@/lib/auth/demo-users';

const createSubjectSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(2),
  name: z.string().min(2),
  teachers: z.array(z.string()).default([]),
  students: z.array(z.string()).default([]),
});

const updateAssignmentSchema = z.object({
  subjectId: z.string().min(1),
  teachers: z.array(z.string()),
  students: z.array(z.string()),
});

export async function GET() {
  return NextResponse.json({ subjects: listDemoSubjects() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createSubjectSchema.parse(body);
    const subject = createDemoSubject(data);
    return NextResponse.json({ subject }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to create subject' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const data = updateAssignmentSchema.parse(body);
    const subject = updateSubjectAssignments(data.subjectId, data.teachers, data.students);
    return NextResponse.json({ subject });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to update subject assignments' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Subject id is required' }, { status: 400 });
  }

  removeDemoSubject(id);
  return NextResponse.json({ success: true });
}
