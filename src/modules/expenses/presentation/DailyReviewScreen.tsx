import { useEffect, useState } from "react"
import { View } from "react-native"
import type { ViewStyle } from "react-native"

import { container } from "@/bootstrap/container"
import { Button } from "@/components/Button"
import { Text } from "@/components/Text"
import { deleteExpense } from "@/modules/expenses/application/delete-expense"
import type { ExpenseEvent } from "@/modules/expenses/domain/entities/expense-event"
import type { ExpenseEventRepository } from "@/modules/expenses/domain/repositories/expense-event-repository"

const $containerStyle = { padding: 16 }
const $listGap = { marginTop: 8 }
const $row: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
}

export function DailyReviewScreen() {
  const [events, setEvents] = useState<ExpenseEvent[]>([])

  useEffect(() => {
    const repo = container.resolve<ExpenseEventRepository>("expenseEventRepository")
    if (!repo) return
    repo.findAll().then(setEvents)
  }, [])

  async function remove(id?: number) {
    if (!id) return
    const repo = container.resolve<ExpenseEventRepository>("expenseEventRepository")
    const sync = container.resolve<any>("syncEngine")
    if (!repo) return

    await deleteExpense(repo, id, sync)

    // refresh list
    const refreshed = await repo.findAll()
    setEvents(refreshed)
  }

  return (
    <View style={$containerStyle}>
      <Text>Daily Review</Text>
      <View style={$listGap}>
        {events.map((e) => (
          <View key={String(e.id)} style={$row}>
            <Text>
              - {e.amount} at {e.created_at}
            </Text>
            <Button onPress={() => remove(e.id)} text="Delete" />
          </View>
        ))}
      </View>
    </View>
  )
}

export default DailyReviewScreen
