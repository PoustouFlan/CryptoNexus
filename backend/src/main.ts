import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { AuthModule } from './auth/auth.module';
import { UsersController } from './users.controller';

@Module({
  controllers: [CoursesController, UsersController],
  imports: [AuthModule],
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
