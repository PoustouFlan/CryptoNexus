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

  @Get(':slug')
  async getCategory(@Param('slug') slug: string) {
    const cat = await prisma.category.findFirst({
      where: { slug },
      include: { children: true, courses: { orderBy: { createdAt: 'desc' } } },
    });
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
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
  @Post(':catSlug')
  async createSubCategory(@Param('catSlug') catSlug: string, @Body() body: any) {
    if (!body.name) throw new BadRequestException('Missing name');
    const cat = await prisma.category.findFirst({
      where: { slug: catSlug }
    });
    if (!cat) throw new BadRequestException('Parent category not found');
    const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return prisma.category.create({
      data: {
        name: body.name,
        slug,
        parentId: cat.id,
        icon: body.icon || null,
      },
    });
  }
}
