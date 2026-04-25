import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

const registerSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  userType: z.enum(['student', 'parent', 'teacher']),
  stream: z.enum(['iranian', 'international']).optional(),
  gradeBand: z.enum(['early-years', 'primary', 'middle', 'secondary']).optional(),
  grade: z.string().optional(),
  locale: z.enum(['en', 'fa']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    const languageMap: Record<string, 'EN' | 'FA'> = {
      en: 'EN',
      fa: 'FA',
    };

    const gradeBandMap: Record<string, 'EARLY_YEARS' | 'PRIMARY' | 'MIDDLE' | 'SECONDARY'> = {
      'early-years': 'EARLY_YEARS',
      primary: 'PRIMARY',
      middle: 'MIDDLE',
      secondary: 'SECONDARY',
    };

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        passwordHash: hashedPassword,
        preferredLanguage: languageMap[data.locale || 'en'],
        profile: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName,
            displayName: `${data.firstName} ${data.lastName}`,
            gradeBand: data.gradeBand ? gradeBandMap[data.gradeBand] : undefined,
          },
        },
      },
      select: {
        id: true,
        email: true,
        phone: true,
        preferredLanguage: true,
        createdAt: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            displayName: true,
            gradeBand: true,
          },
        },
      },
    });

    return NextResponse.json(
      { 
        message: 'User registered successfully',
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    
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
