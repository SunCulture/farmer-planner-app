/**
 * App configuration.
 *
 * API_URL always comes from EXPO_PUBLIC_API_URL (EAS env or local `.env`).
 * Dev vs prod only merges other non-secret overrides from config.dev / config.prod.
 *
 * https://reactnative.dev/docs/security#storing-sensitive-info
 */
import { resolveApiUrl } from "./api-url"
import BaseConfig from "./config.base"
import DevConfig from "./config.dev"
import ProdConfig from "./config.prod"

let ExtraConfig = ProdConfig

if (__DEV__) {
  ExtraConfig = DevConfig
}

const Config = {
  ...BaseConfig,
  ...ExtraConfig,
  API_URL: resolveApiUrl(),
  /** Local/dev-only bearer token — never set this in production EAS envs. */
  DEV_ACCESS_TOKEN: process.env.EXPO_PUBLIC_DEV_ACCESS_TOKEN?.trim() || undefined,
}

export default Config
