import { Controller, Get, Post, Body, Param, Req, UseGuards, BadRequestException } from '@nestjs/common';
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
      select: { id: true, title: true, slug: true, official: true, createdAt: true, author: { select: { id: true, name: true } } },
    });
  }


  @Get(':slug')
  async getCourse(@Param('slug') slug: string) {
    return prisma.course.findUnique({
      where: { slug },
      include: {
        author: { select: { id: true, name: true, email: true } },
        exercises: { include: { exercise: { select: { id: true, title: true, slug: true } } } },
      },
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  // TODO CreateCourseDTO
  async createCourse(@Req() req: Request, @Body() body: any) {
    const user = req.user as any;
    if (!user?.id) throw new Error('Unauthorized');


    if (!body?.title || !body?.content) {
      throw new Error('Missing title or content');
    }


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
}


@Controller('course-exercises')
export class CourseExercisesController {
  @UseGuards(JwtAuthGuard)
  @Post()
  async link(@Req() req: Request, @Body() body: { courseId: string; exerciseId: string }) {
    if (!body.courseId || !body.exerciseId) throw new BadRequestException('Missing courseId or exerciseId');
    return prisma.courseExercise.create({
      data: { courseId: body.courseId, exerciseId: body.exerciseId },
    });
  }
}