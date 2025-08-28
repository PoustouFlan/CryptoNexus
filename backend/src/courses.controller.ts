import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt.guard';

const prisma = new PrismaClient();

@Controller('courses')
export class CoursesController {
  @UseGuards(JwtAuthGuard)
  @Get()
  async allCourses() {
    return prisma.course.findMany();
  }

  @Get(':slug')
  async getCourse(@Param('slug') slug: string) {
    return prisma.course.findUnique({ where: { slug } });
  }

  @Post()
  async createCourse(@Body() body: { title: string, content: string, authorId: string }) {
    return prisma.course.create({ data: { ...body, slug: body.title.toLowerCase().replace(/\s+/g, '-') } });
  }
}
