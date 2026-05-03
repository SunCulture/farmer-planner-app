import { View } from "react-native"
import { useRouter } from "expo-router"

import { Button } from "@/components/Button"
import { Text } from "@/components/Text"

const $container = { padding: 16 }
const $spaced = { marginTop: 12 }
const $gap = { height: 8 }

export default function ExpensesIndex() {
  const router = useRouter()

  return (
    <View style={$container}>
      <Text>Expenses</Text>
      <View style={$spaced}>
        <Button onPress={() => router.push("/expenses/categories")} text="Categories" />
        <View style={$gap} />
        <Button onPress={() => router.push("/expenses/tap")} text="Tap to Log" />
        <View style={$gap} />
        <Button onPress={() => router.push("/expenses/review")} text="Daily Review" />
      </View>
    </View>
  )
}
