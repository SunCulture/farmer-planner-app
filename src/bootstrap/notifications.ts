import * as Notifications from "expo-notifications"

export async function setupNotifications(): Promise<void> {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  })

  const { status } = await Notifications.requestPermissionsAsync()
  if (status !== "granted") {
    console.debug("NOTIFICATIONS: permission not granted")
  }
}

export function addNotificationResponseListener(): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(() => {
    // Handle notification responses here
  })
}
