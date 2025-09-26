import { Controller, Get, Post, Put, Body, Param, Req, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { JwtAuthGuard } from './auth/jwt.guard';
import { makeUniqueCourseSlug } from './utils/slug';
import { Request } from 'express';

const prisma = new PrismaClient();

@Controller('courses')
export class CoursesController {
  @Get('*categoryPath/:courseSlug')
  async getCourse(
    @Param('categoryPath') categoryPath: string,
    @Param('courseSlug') courseSlug: string,
  ) {
    const categories = categoryPath.split('/').filter(Boolean);
    let parent: any = null;
    for (const slug of categories) {
      const cat = await prisma.category.findFirst({
        where: { slug, parentId: parent ? parent.id : null },
      });
      if (!cat) throw new NotFoundException('Category not found');
      parent = cat;
    }
    const course = await prisma.course.findFirst({
      where: { slug: courseSlug, categoryId: parent?.id || null },
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
  @Post('*categoryPath')
  async createCourse(
    @Param('categoryPath') categoryPath: string,
    @Req() req: Request,
    @Body() body: any,
  ) {
    const user = req.user as any;
    if (!user?.id) throw new Error('Unauthorized');
    if (!body?.title || !body?.content)
      throw new Error('Missing title or content');

    const categories = categoryPath.split('/').filter(Boolean);
    let parent: any = null;
    for (const slug of categories) {
      const cat = await prisma.category.findFirst({
        where: { slug, parentId: parent ? parent.id : null },
      });
      if (!cat) throw new BadRequestException('Category not found');
      parent = cat;
    }

    const slug = await makeUniqueCourseSlug(body.title);

    const allCategories = await prisma.category.findMany();

    const course = await prisma.course.create({
      data: {
        title: body.title,
        slug,
        content: body.content,
        official: !!body.official,
        authorId: user.id,
        categoryId: parent?.id || null,
      },
      select: { id: true, title: true, slug: true, categoryId: true },
    });

    return { course, allCategories };
  }

  @UseGuards(JwtAuthGuard)
  @Put('*categoryPath/:courseSlug')
  async updateCourse(
    @Param('categoryPath') categoryPath: string,
    @Param('courseSlug') courseSlug: string,
    @Req() req: Request,
    @Body() body: any,
  ) {
    const user = req.user as any;
    if (!user?.id) throw new Error('Unauthorized');

    const categories = categoryPath.split('/').filter(Boolean);
    let parent: any = null;
    for (const slug of categories) {
      const cat = await prisma.category.findFirst({
        where: { slug, parentId: parent ? parent.id : null },
      });
      if (!cat) throw new BadRequestException('Category not found');
      parent = cat;
    }

    const course = await prisma.course.findFirst({
      where: { slug: courseSlug, categoryId: parent?.id || null },
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

    const allCategories = await prisma.category.findMany();

    return { course: updatedCourse, allCategories };
  }
}
