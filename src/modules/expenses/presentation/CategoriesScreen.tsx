import { useEffect, useState } from "react"
import { View } from "react-native"

import { container } from "@/bootstrap/container"
import { Button } from "@/components/Button"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import type { Category } from "@/modules/expenses/domain/entities/category"
import type { CategoryRepository } from "@/modules/expenses/domain/repositories/category-repository"

const $container = { padding: 16 }
const $listGap = { marginTop: 16 }

export function CategoriesScreen() {
  const [name, setName] = useState("")
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    const repo = container.resolve<CategoryRepository>("categoryRepository")
    if (!repo) return
    repo.findAll().then(setCategories)
  }, [])

  async function add() {
    const repo = container.resolve<CategoryRepository>("categoryRepository")
    if (!repo) return
    const created = await repo.create(name)
    setCategories((s) => [created, ...s])
    setName("")
  }

  return (
    <View style={$container}>
      <Text>Categories</Text>
      <TextField value={name} onChangeText={setName} label="Name" />
      <Button onPress={add} text="Add" />
      <View style={$listGap}>
        {categories.map((c) => (
          <Text key={String(c.id)}>- {c.name}</Text>
        ))}
      </View>
    </View>
  )
}

export default CategoriesScreen
