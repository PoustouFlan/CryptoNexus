import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();


export function basicSlugify(input: string): string {
    return input
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}


export async function makeUniqueCourseSlug(title: string): Promise<string> {
    const base = basicSlugify(title) || 'course';

    const existing = await prisma.course.findUnique({ where: { slug: base } });
    if (!existing) return base;

    for (let i = 2; i < 10_000; i++) {
        const candidate = `${base}-${i}`;
        const hit = await prisma.course.findUnique({ where: { slug: candidate } });
        if (!hit) return candidate;
    }
    return `${base}-${Date.now()}`;
}