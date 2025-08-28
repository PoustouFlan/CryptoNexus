import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { AuthModule } from './auth/auth.module';

@Module({
  controllers: [CoursesController],
  imports: [AuthModule],
})
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
      origin: ["https://cryptonex.us:3000"],
      credentials: true,
  });
  await app.listen(4000);
}
bootstrap();
