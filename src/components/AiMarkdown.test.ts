import { parseBlocks } from "./AiMarkdown"

describe("parseBlocks", () => {
  it("renders bold list labels as bullets with inline emphasis", () => {
    const source = [
      "Yes, water your trees.",
      "",
      "- **Watering frequency**: 2–3 times a week",
      "- **How much water**: Deep soak",
      "- **Best time to water**: Early morning",
    ].join("\n")

    const blocks = parseBlocks(source)
    expect(blocks[0]).toEqual({ type: "paragraph", text: "Yes, water your trees." })
    expect(blocks.filter((b) => b.type === "bullet")).toHaveLength(3)
    expect(blocks.find((b) => b.type === "bullet" && b.text.includes("Watering frequency"))).toBeTruthy()
  })

  it("parses markdown headings", () => {
    const blocks = parseBlocks("## Care tips\n\nKeep mulch away from the trunk.")
    expect(blocks[0]).toEqual({ type: "heading", level: 2, text: "Care tips" })
    expect(blocks.some((b) => b.type === "paragraph")).toBe(true)
  })
})
