export class Container {
  private services = new Map<string, unknown>()

  register<T>(name: string, instance: T) {
    this.services.set(name, instance)
  }

  resolve<T>(name: string): T | undefined {
    return this.services.get(name) as T | undefined
  }
}

export const container = new Container()
