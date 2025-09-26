import { Controller, Get, Post, Body, Param, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { JwtAuthGuard } from './auth/jwt.guard';
import { Request } from 'express';
import { RunnerService } from './runner.service';

const prisma = new PrismaClient();

@Controller('exercises')
export class ExercisesController {
  constructor(private runner: RunnerService) { }

  @Get()
  async all() {
    return prisma.exercise.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, slug: true, language: true, createdAt: true, author: { select: { id: true, name: true } } },
    });
  }

  @Get(':slug')
  async get(@Param('slug') slug: string, @Req() req: Request) {
    const user = req.user as any;
    const exercise = await prisma.exercise.findUnique({
      where: { slug },
      include: { tests: { orderBy: { idx: 'asc' } }, author: { select: { id: true, name: true } } },
    });
    if (!exercise) return null;

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

    for (let lib of body.allowedLibs)
    {
      if (!/^[a-zA-Z0-9]+$/.test(lib))
        throw new BadRequestException("Invalid library name");
    }

    console.log(body);
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
        allowedLibs: Array.isArray(body.allowedLibs) ? body.allowedLibs : [],
      },
    });

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


    const runRes = await this.runner.runPythonSubmission({ exercise, tests: exercise.tests, code: body.code });

    const results = (runRes.results || []).map((r: any, i: number) => {
      const expected = exercise.tests[i].expected;
      return { ...r, ok: (r.stdout.trim() === expected.trim()) };
    });
    const status = runRes.status != 'OK' ? runRes.status :
                   results.every((r:any) => r.ok) ? 'OK' : 'WA';

    const submission = await prisma.submission.create({
      data: {
        exerciseId: exercise.id,
        authorId: user?.id,
        status,
        resultJson: JSON.stringify(results)
      }
    });


    return { submissionId: submission.id, status, results };
  }
}