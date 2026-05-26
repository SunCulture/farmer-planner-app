import { Redirect } from "expo-router"
import { isOnboardingComplete } from "@/modules/onboarding"

export default function Index() {
  return isOnboardingComplete()
    ? <Redirect href={"/(tabs)/" as any} />
    : <Redirect href={"/onboarding" as any} />
}
