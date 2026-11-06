import { prisma } from '../../db/prisma';
import { AppError } from '../../utils/AppError';
import type { CategoryInput } from './categories.schemas';

/** Shape embedded in course responses, so every course card exposes the same category fields. */
export const categorySelect = { select: { id: true, name: true } } as const;

/** Public list for filters/dropdowns, with the number of published courses in each category. */
export const listCategories = async () => {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { courses: { where: { published: true } } } } },
  });
  return categories.map(({ _count, ...c }) => ({ ...c, courseCount: _count.courses }));
};

/** Used by course create/update so a bad categoryId is a clear 400, not a database error. */
export const assertCategoryExists = async (categoryId: string) => {
  const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } });
  if (!category) throw AppError.badRequest('Category does not exist');
};

// Names are unique ignoring case ("Design" and "design" are the same category).
const assertNameFree = async (name: string, exceptId?: string) => {
  const clash = await prisma.category.findFirst({
    where: { name: { equals: name, mode: 'insensitive' }, ...(exceptId && { id: { not: exceptId } }) },
    select: { id: true },
  });
  if (clash) throw AppError.conflict('A category with this name already exists');
};

export const createCategory = async (input: CategoryInput) => {
  await assertNameFree(input.name);
  return prisma.category.create({ data: input });
};

export const updateCategory = async (categoryId: string, input: CategoryInput) => {
  await assertNameFree(input.name, categoryId);
  return prisma.category.update({ where: { id: categoryId }, data: input });
};

export const deleteCategory = async (categoryId: string) => {
  const inUse = await prisma.course.count({ where: { categoryId } });
  if (inUse > 0) throw AppError.conflict(`Category is used by ${inUse} course(s); reassign them first`);
  await prisma.category.delete({ where: { id: categoryId } });
};
