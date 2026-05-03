export interface ApiClient {
  get<T = any>(path: string, params?: Record<string, any>): Promise<T>
  post<T = any>(path: string, body?: any): Promise<T>
  put<T = any>(path: string, body?: any): Promise<T>
  delete<T = any>(path: string): Promise<T>
}

export default ApiClient
