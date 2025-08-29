import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt.guard';
import { PrismaClient } from '@prisma/client';
import { Request } from 'express';


const prisma = new PrismaClient();


@Controller('users')
export class UsersController {
    @UseGuards(JwtAuthGuard)
    @Get('me/courses')
    async myCourses(@Req() req: Request) {
        const user = req.user as any;
        return prisma.course.findMany({
            where: { authorId: user.id },
            orderBy: { createdAt: 'desc' },
            select: { id: true, title: true, slug: true, createdAt: true, official: true },
        });
    }
}