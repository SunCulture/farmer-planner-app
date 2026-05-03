import type { Category } from "../entities/category"

export interface CategoryRepository {
  create(name: string): Promise<Category>
  findAll(): Promise<Category[]>
  findById(id: number): Promise<Category | undefined>
  update(category: Category): Promise<void>
  delete(id: number): Promise<void>
}
