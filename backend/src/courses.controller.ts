import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { JwtAuthGuard } from './auth/jwt.guard';
import { makeUniqueCourseSlug } from './utils/slug';
import { Request } from 'express';

const prisma = new PrismaClient();

@Controller('courses')
export class CoursesController {
  // Public list, minimal fields + author name
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
      include: { author: { select: { id: true, name: true, email: true } } },
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
        official: !!body.official && false, // force false for now; gate later with roles
        authorId: user.id,
      },
      select: { id: true, title: true, slug: true },
    });


    return course;
  }
}