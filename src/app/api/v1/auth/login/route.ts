import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateDemoUser } from '@/lib/auth/demo-users';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = loginSchema.parse(body);

    const matchedUser = authenticateDemoUser(data.email, data.password);

    if (matchedUser) {
      return NextResponse.json({
        message: 'Login successful',
        user: matchedUser,
      });
    }

    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
