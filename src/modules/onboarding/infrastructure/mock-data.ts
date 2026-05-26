// Mock data — replace with API responses when backend is available

export const REGIONS = [
  { id: "nairobi", name: "Nairobi", emoji: "🏙️", temp: "24°C" },
  { id: "nakuru", name: "Nakuru", emoji: "🌽", temp: "21°C" },
  { id: "kisumu", name: "Kisumu", emoji: "🌊", temp: "28°C" },
  { id: "mombasa", name: "Mombasa", emoji: "☀️", temp: "31°C" },
  { id: "eldoret", name: "Eldoret", emoji: "🥬", temp: "18°C" },
  { id: "kitale", name: "Kitale", emoji: "🌽", temp: "20°C" },
  { id: "machakos", name: "Machakos", emoji: "⛰️", temp: "23°C" },
  { id: "nyeri", name: "Nyeri", emoji: "🍃", temp: "19°C" },
  { id: "meru", name: "Meru", emoji: "🌱", temp: "22°C" },
  { id: "thika", name: "Thika", emoji: "🍍", temp: "25°C" },
  { id: "kisii", name: "Kisii", emoji: "🫐", temp: "20°C" },
  { id: "kakamega", name: "Kakamega", emoji: "🌧️", temp: "26°C" },
  { id: "garissa", name: "Garissa", emoji: "🌵", temp: "35°C" },
  { id: "narok", name: "Narok", emoji: "🦁", temp: "22°C" },
] as const

export const CROPS = [
  { id: "maize", name: "Maize", emoji: "🌽" },
  { id: "beans", name: "Beans", emoji: "🫘" },
  { id: "tomatoes", name: "Tomatoes", emoji: "🍅" },
  { id: "kale", name: "Kale", emoji: "🥬" },
  { id: "potatoes", name: "Potatoes", emoji: "🥔" },
  { id: "onions", name: "Onions", emoji: "🧅" },
  { id: "capsicum", name: "Capsicum", emoji: "🫑" },
  { id: "watermelon", name: "Watermelon", emoji: "🍉" },
  { id: "avocado", name: "Avocado", emoji: "🥑" },
  { id: "mango", name: "Mango", emoji: "🥭" },
  { id: "banana", name: "Banana", emoji: "🍌" },
  { id: "coffee", name: "Coffee", emoji: "☕" },
  { id: "tea", name: "Tea", emoji: "🍵" },
] as const

export const LIVESTOCK = [
  { id: "cows", name: "Cows", emoji: "🐄" },
  { id: "goats", name: "Goats", emoji: "🐐" },
  { id: "chickens", name: "Chickens", emoji: "🐔" },
  { id: "sheep", name: "Sheep", emoji: "🐑" },
  { id: "pigs", name: "Pigs", emoji: "🐷" },
  { id: "rabbits", name: "Rabbits", emoji: "🐰" },
  { id: "ducks", name: "Ducks", emoji: "🦆" },
  { id: "bees", name: "Bees", emoji: "🐝" },
] as const

export const GOALS = [
  { id: "money", name: "Make more money", emoji: "💰" },
  { id: "harvest", name: "Increase harvest", emoji: "🌽" },
  { id: "time", name: "Save time", emoji: "⏰" },
  { id: "losses", name: "Reduce farm losses", emoji: "📉" },
  { id: "livestock_health", name: "Improve livestock health", emoji: "🐄" },
  { id: "modern", name: "Learn modern farming", emoji: "📚" },
] as const
