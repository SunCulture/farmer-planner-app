export type Category = {
  id?: number
  name: string
  /** Hex color string used to tint the tap button and widget. e.g. "#4CAF50" */
  color_hex: string
  /** Optional default amount (in smallest currency unit) pre-filled on tap. */
  default_amount?: number | null
}
