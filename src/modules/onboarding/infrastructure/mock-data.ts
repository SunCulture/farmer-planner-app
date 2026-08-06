// Mock data — replace with API responses when backend is available

export const REGIONS = [
  { id: "nairobi", name: "Nairobi", temp: "24°C" },
  { id: "nakuru", name: "Nakuru", temp: "21°C" },
  { id: "kisumu", name: "Kisumu", temp: "28°C" },
  { id: "mombasa", name: "Mombasa", temp: "31°C" },
  { id: "eldoret", name: "Eldoret", temp: "18°C" },
  { id: "kitale", name: "Kitale", temp: "20°C" },
  { id: "machakos", name: "Machakos", temp: "23°C" },
  { id: "nyeri", name: "Nyeri", temp: "19°C" },
  { id: "meru", name: "Meru", temp: "22°C" },
  { id: "thika", name: "Thika", temp: "25°C" },
  { id: "kisii", name: "Kisii", temp: "20°C" },
  { id: "kakamega", name: "Kakamega", temp: "26°C" },
  { id: "garissa", name: "Garissa", temp: "35°C" },
  { id: "narok", name: "Narok", temp: "22°C" },
] as const

export const CROPS = [
  { id: "maize", name: "Maize" },
  { id: "beans", name: "Beans" },
  { id: "tomatoes", name: "Tomatoes" },
  { id: "kale", name: "Kale" },
  { id: "potatoes", name: "Potatoes" },
  { id: "onions", name: "Onions" },
  { id: "capsicum", name: "Capsicum" },
  { id: "watermelon", name: "Watermelon" },
  { id: "avocado", name: "Avocado" },
  { id: "mango", name: "Mango" },
  { id: "banana", name: "Banana" },
  { id: "coffee", name: "Coffee" },
  { id: "tea", name: "Tea" },
] as const

export const LIVESTOCK = [
  { id: "cows", name: "Cows" },
  { id: "goats", name: "Goats" },
  { id: "chickens", name: "Chickens" },
  { id: "sheep", name: "Sheep" },
  { id: "pigs", name: "Pigs" },
  { id: "rabbits", name: "Rabbits" },
  { id: "ducks", name: "Ducks" },
  { id: "bees", name: "Bees" },
] as const

export const GOALS = [
  { id: "MAKE_MONEY", name: "Make more money" },
  { id: "FOOD_SECURITY", name: "Increase harvest" },
  { id: "SAVE_TIME", name: "Save time" },
  { id: "REDUCE_LOSSES", name: "Reduce farm losses" },
  { id: "LIVESTOCK_HEALTH", name: "Improve livestock health" },
  { id: "MODERN_FARMING", name: "Learn modern farming" },
] as const
