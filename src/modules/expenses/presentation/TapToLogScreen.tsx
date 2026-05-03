import { View } from "react-native"

import { container } from "@/bootstrap/container"
import { Button } from "@/components/Button"
import { createExpense } from "@/modules/expenses/application/create-expense"
import { predictCategory } from "@/modules/expenses/application/predict-category"
import type { CategoryRepository } from "@/modules/expenses/domain/repositories/category-repository"
import type { ExpenseEventRepository } from "@/modules/expenses/domain/repositories/expense-event-repository"

const $containerStyle = { padding: 16 }

export function TapToLogScreen() {
  async function tap() {
    const repo = container.resolve<ExpenseEventRepository>("expenseEventRepository")
    const categoryRepo = container.resolve<CategoryRepository>("categoryRepository")
    const syncEngine = container.resolve<any>("syncEngine")
    if (!repo || !categoryRepo) return

    const predicted = await predictCategory(categoryRepo, repo)
    await createExpense(repo, 100, predicted ?? null, syncEngine)
    // lightweight feedback could be added later
  }

  return (
    <View style={$containerStyle}>
      <Button onPress={tap} text="Tap to Log (100)" />
    </View>
  )
}

export default TapToLogScreen
