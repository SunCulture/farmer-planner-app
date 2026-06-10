import { Slot, SplashScreen } from "expo-router"

import AppProviders from "@/bootstrap/AppProviders"

import { DevAuthGate } from "./DevAuthGate"

SplashScreen.preventAutoHideAsync()

if (__DEV__) {
  require("@/devtools/ReactotronConfig")
}

export default function Root() {
  return (
    <AppProviders>
      <DevAuthGate>
        <Slot />
      </DevAuthGate>
    </AppProviders>
  )
}
