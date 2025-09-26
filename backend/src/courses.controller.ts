import { Controller, Get, Post, Put, Body, Param, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { JwtAuthGuard } from './auth/jwt.guard';
import { makeUniqueCourseSlug } from './utils/slug';
import { Request } from 'express';

const prisma = new PrismaClient();

@Controller('courses')
export class CoursesController {
  @Get()
  async allCourses() {
    return prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        official: true,
        createdAt: true,
        author: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  @Get(':slug')
  async getCourse(@Param('slug') slug: string) {
    return prisma.course.findUnique({
      where: { slug },
      include: {
        author: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true, slug: true } },
        exercises: {
          include: {
            exercise: {
              select: {
                id: true,
                title: true,
                slug: true,
                language: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createCourse(@Req() req: Request, @Body() body: any) {
    const user = req.user as any;
    if (!user?.id) throw new Error('Unauthorized');
    if (!body?.title || !body?.content) throw new Error('Missing title or content');
    const slug = await makeUniqueCourseSlug(body.title);
    const course = await prisma.course.create({
      data: {
        title: body.title,
        slug,
        content: body.content,
        official: !!body.official,
        authorId: user.id,
        categoryId: body.categoryId || null,
      },
      select: { id: true, title: true, slug: true },
    });
    return course;
  }

  @UseGuards(JwtAuthGuard)
  @Put(':slug')
  async updateCourse(@Param('slug') slug: string, @Req() req: Request, @Body() body: any) {
    const user = req.user as any;
    if (!user?.id) throw new Error('Unauthorized');
    const course = await prisma.course.findUnique({ where: { slug } });
    if (!course) throw new BadRequestException('Course not found');
    if (course.authorId !== user.id) throw new BadRequestException('Cannot edit others course');
    return prisma.course.update({
      where: { slug },
      data: {
        title: body.title || course.title,
        content: body.content || course.content,
        categoryId: body.categoryId || course.categoryId,
      },
    });
  }
}
