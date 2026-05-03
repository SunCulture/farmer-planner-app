/*
  Integration test for the SqliteCategoryRepository.
  This test is skipped by default; to run it you must execute:

    RUN_NATIVE_INTEGRATION_TESTS=1 pnpm test

  Running this test requires a runtime that provides `expo-sqlite` (device or emulator).
*/

const shouldRun = process.env.RUN_NATIVE_INTEGRATION_TESTS === "1"

if (!shouldRun) {
  test.skip("expenses repository native integration (skipped)", () => {})
} else {
  const { initDatabase } = require("../src/shared/infrastructure/database")
  const SqliteCategoryRepository =
    require("../src/modules/expenses/infrastructure/sqlite/category-repository").default

  describe("SqliteCategoryRepository (integration)", () => {
    beforeAll(async () => {
      await initDatabase()
    })

    test("create and find category", async () => {
      const repo = new SqliteCategoryRepository()
      const created = await repo.create("Integration Test Category")
      expect(created).toBeDefined()
      expect(created.id).toBeGreaterThan(0)

      const all = await repo.findAll()
      const found = all.find((c) => c.name === "Integration Test Category")
      expect(found).toBeDefined()
    })
  })
}
