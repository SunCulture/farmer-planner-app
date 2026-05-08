import {
  type ConfigPlugin,
  withEntitlementsPlist,
  withDangerousMod,
  withInfoPlist,
} from "@expo/config-plugins"
import * as fs from "fs"
import * as path from "path"

const APP_GROUP_ID = "group.com.tapitappreactnative.widget"
const WIDGET_EXTENSION_NAME = "TappWidget"

/**
 * iOS config plugin for the Tapp home-screen widget.
 *
 * Responsibilities:
 *  1. Adds the App Groups entitlement to the main app target so the JS bridge
 *     (TappWidgetModule.swift) can write to the shared UserDefaults suite.
 *  2. Copies the Swift widget extension sources into ios/TappWidget/.
 *  3. Registers the widget bundle identifier in Info.plist (NSExtension).
 *
 * NOTE: Adding a new Xcode target (the widget extension itself) requires
 * manipulating the Xcode project file. This plugin handles the file copies
 * and entitlements; the target must be added manually in Xcode after the
 * first `expo prebuild`, or via a more complete @expo/config-plugins
 * withXcodeProject modification. Instructions are in docs/widget-setup-ios.md.
 */
const withTappWidgetIos: ConfigPlugin = (config) => {
  // 1. Add App Groups entitlement to main app
  config = withEntitlementsPlist(config, (cfg) => {
    const entitlements = cfg.modResults as Record<string, any>
    const groups: string[] = entitlements["com.apple.security.application-groups"] ?? []
    if (!groups.includes(APP_GROUP_ID)) {
      entitlements["com.apple.security.application-groups"] = [...groups, APP_GROUP_ID]
    }
    return cfg
  })

  // 2. Copy Swift widget extension sources into the Xcode project directory
  config = withDangerousMod(config, [
    "ios",
    (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot
      const srcDir = path.join(__dirname, "..", "ios", WIDGET_EXTENSION_NAME)
      const destDir = path.join(projectRoot, "ios", WIDGET_EXTENSION_NAME)

      if (fs.existsSync(srcDir)) {
        fs.mkdirSync(destDir, { recursive: true })
        for (const file of fs.readdirSync(srcDir)) {
          const srcFile = path.join(srcDir, file)
          const destFile = path.join(destDir, file)
          if (fs.statSync(srcFile).isFile()) {
            fs.copyFileSync(srcFile, destFile)
          }
        }
      }

      return cfg
    },
  ])

  return config
}

export default withTappWidgetIos
