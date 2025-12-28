import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { AuthModule } from './auth/auth.module';
import { UsersController } from './users.controller';
import { CategoriesController } from './categories.controller';
import { ExercisesController } from './exercises.controller';
import { RunnerService } from './runner.service';
import { CourseExercisesController } from './course-exercises.controller';
import { json, urlencoded } from 'express';

@Module({
  controllers: [CoursesController, UsersController, CategoriesController, ExercisesController, CourseExercisesController],
  imports: [AuthModule],
  providers: [RunnerService],
})
class AppModule {}

const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {'bodyParser': false});
  app.enableCors({
      origin: [FRONTEND_URL],
      credentials: true,
  });
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  await app.listen(4000);
}
bootstrap();
