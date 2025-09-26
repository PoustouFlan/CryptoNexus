import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { CourseExercisesController, CoursesController } from './courses.controller';
import { AuthModule } from './auth/auth.module';
import { UsersController } from './users.controller';
import { CategoriesController } from './categories.controller';
import { ExercisesController } from './exercises.controller';
import { RunnerService } from './runner.service';

@Module({
  controllers: [CoursesController, UsersController, CategoriesController, ExercisesController, CourseExercisesController],
  imports: [AuthModule],
  providers: [RunnerService],
})
class AppModule {}

const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
      origin: [FRONTEND_URL],
      credentials: true,
  });
  await app.listen(4000);
}
bootstrap();
