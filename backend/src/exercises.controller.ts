import { Controller, Get, Post, Body, Param, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { JwtAuthGuard } from './auth/jwt.guard';
import { Request } from 'express';
import { RunnerService } from './runner.service';

const prisma = new PrismaClient();

@Controller('exercises')
export class ExercisesController {
  constructor(private runner: RunnerService) {}

  @Get()
  async all() {
    return prisma.exercise.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, slug: true, language: true, createdAt: true, author: { select: { id: true, name: true } } },
    });
  }

  @Get(':slug')
  async get(@Param('slug') slug: string, @Req() req: Request) {
    const user = req.user as any; // may be undefined
    const exercise = await prisma.exercise.findUnique({
      where: { slug },
      include: { tests: { orderBy: { idx: 'asc' } }, author: { select: { id: true, name: true } } },
    });
    if (!exercise) return null;

    // Do NOT expose expected outputs to anonymous users. Expose only test inputs.
    const tests = (exercise.tests || []).map(t => ({ id: t.id, idx: t.idx, input: t.input, expected: (user && user.id === exercise.authorId) ? t.expected : undefined }));

    return { ...exercise, tests };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Req() req: Request, @Body() body: any) {
    const user = req.user as any;
    if (!body?.title || !body?.statement) throw new BadRequestException('Missing title or statement');

    const slugBase = body.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
    let slug = slugBase;
    for (let i = 1; i < 10000; i++) {
      const exists = await prisma.exercise.findUnique({ where: { slug } });
      if (!exists) break;
      slug = `${slugBase}-${i}`;
    }

    const exercise = await prisma.exercise.create({
      data: {
        title: body.title,
        slug,
        statement: body.statement,
        codeStub: body.codeStub || '',
        language: body.language || 'python',
        timeoutSec: body.timeoutSec || 3,
        official: !!body.official && false,
        authorId: user.id,
      },
    });

    // create tests if provided
    if (Array.isArray(body.tests)) {
      for (let i = 0; i < body.tests.length; i++) {
        const t = body.tests[i];
        await prisma.exerciseTest.create({ data: { exerciseId: exercise.id, idx: i, input: t.input || '', expected: t.expected || '' } });
      }
    }

    return { id: exercise.id, title: exercise.title, slug: exercise.slug };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':slug/submit')
  async submit(@Param('slug') slug: string, @Req() req: Request, @Body() body: any) {
    const user = req.user as any;
    if (!body?.code) throw new BadRequestException('Missing code');

    const exercise = await prisma.exercise.findUnique({ where: { slug }, include: { tests: true } });
    if (!exercise) throw new BadRequestException('Exercise not found');

    // fetch tests
    const tests = await prisma.exerciseTest.findMany({ where: { exerciseId: exercise.id }, orderBy: { idx: 'asc' } });

    // Run the runner
    const runRes = await this.runner.runPythonSubmission({ exercise, tests, code: body.code });

    // store submission
    const submission = await prisma.submission.create({ data: { exerciseId: exercise.id, authorId: user?.id, status: runRes.status, resultJson: JSON.stringify(runRes) } });

    return { submissionId: submission.id, result: runRes };
  }
}