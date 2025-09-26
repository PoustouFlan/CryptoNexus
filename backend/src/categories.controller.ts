import { Controller, Get, Param, Post, Body, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt.guard';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Controller('categories')
export class CategoriesController {
  @Get()
  async allCategories() {
    return prisma.category.findMany({
      where: { parentId: null },
      include: { children: true },
      orderBy: { name: 'asc' },
    });
  }

  @Get('*path')
  async getCategory(@Param('path') path: string) {
    const segments = path.split('/').filter(Boolean);
    let parent: any = null;
    for (const slug of segments) {
      const cat = await prisma.category.findFirst({
        where: { slug, parentId: parent ? parent.id : null },
        include: { children: true, courses: { orderBy: { createdAt: 'desc' } } },
      });
      if (!cat) throw new NotFoundException('Category not found');
      parent = cat;
    }
    return parent;
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createCategory(@Body() body: any) {
    if (!body.name) throw new BadRequestException('Missing name');
    const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return prisma.category.create({
      data: {
        name: body.name,
        slug,
        parentId: body.parentId || null,
        icon: body.icon || null,
      },
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('*path')
  async createSubCategory(@Param('path') path: string, @Body() body: any) {
    if (!body.name) throw new BadRequestException('Missing name');
    const segments = path.split('/').filter(Boolean);
    let parent: any = null;
    for (const slug of segments) {
      const cat = await prisma.category.findFirst({
        where: { slug, parentId: parent ? parent.id : null },
      });
      if (!cat) throw new BadRequestException('Parent category not found');
      parent = cat;
    }
    const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return prisma.category.create({
      data: {
        name: body.name,
        slug,
        parentId: parent?.id || null,
        icon: body.icon || null,
      },
    });
  }
}
