import { Controller, Get, Param } from '@nestjs/common';
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
    const category = await prisma.category.findFirst({
      where: { slug },
      include: {
        children: true,
        courses: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!category) return null;
    return category;
  }
}
