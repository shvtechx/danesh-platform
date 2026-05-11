import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import { prisma } from '@/lib/db';

const concernReportSchema = z.object({
  reporterId: z.string().optional().nullable(),
  concernType: z.enum(['BULLYING', 'HARASSMENT', 'SELF_HARM', 'ACADEMIC', 'TECHNICAL', 'OTHER']).default('OTHER'),
  description: z.string().min(5),
  targetUserId: z.string().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  anonymous: z.boolean().optional().default(true),
});

type FallbackConcernReport = {
  id: string;
  reporterId: string | null;
  concernType: 'BULLYING' | 'HARASSMENT' | 'SELF_HARM' | 'ACADEMIC' | 'TECHNICAL' | 'OTHER';
  description: string;
  targetUserId: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'NEW';
  createdAt: string;
};

const fallbackFilePath = path.join(process.cwd(), 'data', 'wellbeing_concern_reports.json');

async function readFallbackReports(): Promise<FallbackConcernReport[]> {
  try {
    const raw = await fs.readFile(fallbackFilePath, 'utf-8');
    return JSON.parse(raw) as FallbackConcernReport[];
  } catch {
    return [];
  }
}

async function writeFallbackReports(reports: FallbackConcernReport[]) {
  await fs.mkdir(path.dirname(fallbackFilePath), { recursive: true });
  await fs.writeFile(fallbackFilePath, JSON.stringify(reports, null, 2), 'utf-8');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    try {
      const reports = await prisma.concernReport.findMany({
        where: status ? { status: status as any } : undefined,
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return NextResponse.json({ reports, storage: 'database' });
    } catch {
      const reports = await readFallbackReports();
      const filteredReports = status ? reports.filter((report) => report.status === status) : reports;
      return NextResponse.json({ reports: filteredReports.slice(0, limit), storage: 'fallback-file' });
    }
  } catch (error) {
    console.error('Error fetching concern reports:', error);
    return NextResponse.json({ error: 'Failed to fetch concern reports' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = concernReportSchema.parse(await request.json());
    const reporterId = parsed.anonymous ? null : parsed.reporterId || null;

    try {
      if (reporterId) {
        const existingUser = await prisma.user.findUnique({ where: { id: reporterId } });
        if (!existingUser) {
          await prisma.user.create({
            data: {
              id: reporterId,
            },
          });
        }
      }

      const report = await prisma.concernReport.create({
        data: {
          reporterId,
          concernType: parsed.concernType,
          description: parsed.description,
          targetUserId: parsed.targetUserId || null,
          priority: parsed.priority || 'MEDIUM',
        },
      });

      return NextResponse.json({
        message: 'Concern report submitted successfully',
        report,
        storage: 'database',
      }, { status: 201 });
    } catch {
      const reports = await readFallbackReports();
      const fallbackReport: FallbackConcernReport = {
        id: `local-report-${Date.now()}`,
        reporterId,
        concernType: parsed.concernType,
        description: parsed.description,
        targetUserId: parsed.targetUserId || null,
        priority: parsed.priority || 'MEDIUM',
        status: 'NEW',
        createdAt: new Date().toISOString(),
      };

      reports.unshift(fallbackReport);
      await writeFallbackReports(reports);

      return NextResponse.json({
        message: 'Concern report submitted successfully',
        report: fallbackReport,
        storage: 'fallback-file',
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating concern report:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to submit concern report' }, { status: 500 });
  }
}
