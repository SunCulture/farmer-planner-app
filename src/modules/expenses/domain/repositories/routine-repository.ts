import type { Routine } from "../entities/routine"

export interface RoutineRepository {
  create(name: string): Promise<Routine>
  findAll(): Promise<Routine[]>
  findById(id: number): Promise<Routine | undefined>
  update(routine: Routine): Promise<void>
  delete(id: number): Promise<void>
}

export default RoutineRepository
