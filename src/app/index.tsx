import { Redirect } from "expo-router"
import { isOnboardingComplete, loadAuthToken } from "@/modules/onboarding"
import { api } from "@/services/api"

export default function Index() {
  const token = loadAuthToken()
  if (token) {
    api.setAuthToken(token)
    if (isOnboardingComplete()) {
      return <Redirect href={"/(tabs)/" as any} />
    }
  }
  return <Redirect href={"/onboarding" as any} />
}
