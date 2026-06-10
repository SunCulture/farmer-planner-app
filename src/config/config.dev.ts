/**
 * These are configuration settings for the dev environment.
 *
 * Do not include API secrets in this file or anywhere in your JS.
 *
 * https://reactnative.dev/docs/security#storing-sensitive-info
 */
export default {
  API_URL: "https://e0e3-197-155-74-246.ngrok-free.app/",
  DEV_ACCESS_TOKEN: process.env.EXPO_PUBLIC_DEV_ACCESS_TOKEN ?? "",
}
