/** Map backend presenter status colors to local UI buckets. */
export function statusColorToUi(color: string): "good" | "warn" | "bad" {
  if (color === "green") return "good"
  if (color === "amber" || color === "slate") return "warn"
  return "bad"
}
