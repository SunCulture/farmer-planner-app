import type { Category } from "../domain/entities/category"
import type { CategoryRepository } from "../domain/repositories/category-repository"

export async function createCategory(repo: CategoryRepository, name: string): Promise<Category> {
  const trimmed = name?.trim()
  if (!trimmed) throw new Error("Invalid category name")
  return repo.create(trimmed)
}

export default createCategory
