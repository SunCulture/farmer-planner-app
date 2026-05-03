import { Slot, SplashScreen } from "expo-router"

import AppProviders from "@/bootstrap/AppProviders"

SplashScreen.preventAutoHideAsync()

if (__DEV__) {
  // Load Reactotron configuration in development. We don't want to
  // include this in our production bundle, so we are using `if (__DEV__)`
  // to only execute this in development.
  require("@/devtools/ReactotronConfig")
}

export default function Root() {
  return (
    <AppProviders>
      <Slot />
    </AppProviders>
  )
}
