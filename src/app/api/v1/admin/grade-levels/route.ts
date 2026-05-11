import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const grades = await prisma.gradeLevel.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ grades });
  } catch {
    return NextResponse.json({ grades: [] }, { status: 500 });
  }
}
