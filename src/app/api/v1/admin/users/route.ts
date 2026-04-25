import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createDemoUser, listDemoUsers, removeDemoUser } from '@/lib/auth/demo-users';

const createUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  profile: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    displayName: z.string().min(1),
  }),
  roles: z.array(z.enum(['SUPER_ADMIN', 'SUBJECT_ADMIN', 'TEACHER', 'STUDENT'])).min(1),
  managedSubjects: z.array(z.string()).optional(),
  assignedSubjects: z.array(z.string()).optional(),
  assignedStudents: z.array(z.string()).optional(),
  dashboardPath: z.enum(['admin', 'teacher', 'dashboard']),
});

export async function GET() {
  return NextResponse.json({ users: listDemoUsers() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createUserSchema.parse(body);

    const user = createDemoUser({
      ...data,
      status: 'ACTIVE',
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'User id is required' }, { status: 400 });
  }

  removeDemoUser(id);
  return NextResponse.json({ success: true });
}
