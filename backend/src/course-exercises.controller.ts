import { Controller, Put, Body, Param, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Controller('course-exercises')
export class CourseExercisesController {
  @Put(':slug')
  async updateCourseExercises(@Param('slug') slug: string, @Body() body: { exerciseIds: string[] }) {
    const course = await prisma.course.findUnique({ where: { slug } });
    if (!course) throw new BadRequestException('Course not found');

    await prisma.courseExercise.deleteMany({ where: { courseId: course.id } });

    if (Array.isArray(body.exerciseIds)) {
      for (const exId of body.exerciseIds) {
        await prisma.courseExercise.create({ data: { courseId: course.id, exerciseId: exId } });
      }
    }

    return { success: true };
  }
}
