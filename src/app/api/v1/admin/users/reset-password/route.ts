import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { RoleName } from '@prisma/client';
import { prisma } from '@/lib/db';

const schema = z.object({
  userId: z.string().min(1),
  newPassword: z.string().min(8).optional(),
});

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());

    const user = await prisma.user.findUnique({
      where: { id: body.userId },
      include: { userRoles: { include: { role: true } } },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent resetting super-admin password
    if (user.userRoles.some((ur) => ur.role.name === RoleName.SUPER_ADMIN)) {
      return NextResponse.json({ error: 'Super admin passwords cannot be reset here' }, { status: 403 });
    }

    const newPassword = body.newPassword?.trim() || generatePassword();
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: body.userId },
      data: { passwordHash },
    });

    return NextResponse.json({ success: true, newPassword });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error('Password reset error:', error);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
