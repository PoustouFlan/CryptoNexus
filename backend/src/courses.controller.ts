import { Controller, Get, Post, Put, Body, Param, Req, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { JwtAuthGuard } from './auth/jwt.guard';
import { makeUniqueCourseSlug } from './utils/slug';
import { Request } from 'express';

const prisma = new PrismaClient();

@Controller('courses')
export class CoursesController {
  @Get(':courseSlug')
  async getCourse(
    @Param('courseSlug') courseSlug: string,
  ) {
    const course = await prisma.course.findFirst({
      where: { slug: courseSlug },
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
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createCourse(
    @Req() req: Request,
    @Body() body: any,
  ) {
    const user = req.user as any;
    if (!user?.id) throw new Error('Unauthorized');
    if (!body?.title || !body?.content)
      throw new Error('Missing title or content');

    const slug = await makeUniqueCourseSlug(body.title);

    const allCategories = await prisma.category.findMany();

    const course = await prisma.course.create({
      data: {
        title: body.title,
        slug,
        content: body.content,
        official: !!body.official,
        authorId: user.id,
        categoryId: body.categoryId || null,
      },
      select: { id: true, title: true, slug: true, categoryId: true },
    });

    return course;
  }

  @UseGuards(JwtAuthGuard)
  @Put(':courseSlug')
  async updateCourse(
    @Param('courseSlug') courseSlug: string,
    @Req() req: Request,
    @Body() body: any,
  ) {
    const user = req.user as any;
    if (!user?.id) throw new Error('Unauthorized');

    const course = await prisma.course.findFirst({
      where: { slug: courseSlug },
    });
    if (!course) throw new BadRequestException('Course not found');
    if (course.authorId !== user.id)
      throw new BadRequestException('Cannot edit others course');

    const updatedCourse = await prisma.course.update({
      where: { id: course.id },
      data: {
        title: body.title || course.title,
        content: body.content || course.content,
        categoryId: body.categoryId || course.categoryId,
      },
    });

    return updatedCourse;
  }
}
