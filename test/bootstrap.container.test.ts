import { Container } from "@/bootstrap/container"

describe("Container", () => {
  test("register and resolve", () => {
    const c = new Container()
    c.register("foo", 123)
    const v = c.resolve<number>("foo")
    expect(v).toBe(123)
  })
})
