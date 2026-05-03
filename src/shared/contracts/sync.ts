export interface SyncEngine {
  enqueue(payload: unknown): Promise<void>
  flush(): Promise<void>
}

export default SyncEngine
