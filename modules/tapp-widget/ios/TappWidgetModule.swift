import ExpoModulesCore
import WidgetKit

private let appGroupId = "group.com.tapitappreactnative.widget"
private let userDefaultsKey = "tapp_widget_data"

public class TappWidgetModule: Module {
    public func definition() -> ModuleDefinition {
        Name("TappWidget")

        // Writes widget state JSON to App Groups UserDefaults and requests
        // a WidgetKit timeline refresh so the home-screen widget updates.
        Function("setWidgetData") { (json: String) in
            UserDefaults(suiteName: appGroupId)?.set(json, forKey: userDefaultsKey)
            if #available(iOS 14.0, *) {
                WidgetCenter.shared.reloadTimelines(ofKind: "TappWidget")
            }
        }

        // Returns the last stored widget data JSON, or nil.
        Function("getWidgetData") { () -> String? in
            UserDefaults(suiteName: appGroupId)?.string(forKey: userDefaultsKey)
        }
    }
}
