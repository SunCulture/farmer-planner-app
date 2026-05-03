export interface Telemetry {
  trackEvent(name: string, props?: Record<string, any>): void
  captureError(err: Error, props?: Record<string, any>): void
}

export default Telemetry
