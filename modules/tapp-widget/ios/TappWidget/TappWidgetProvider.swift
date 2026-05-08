import WidgetKit
import SwiftUI

/// App group identifier — must match the entitlement configured by the config plugin.
private let appGroupId = "group.com.tapitappreactnative.widget"
private let userDefaultsKey = "tapp_widget_data"
private let deepLinkURL = URL(string: "tapp://expenses/tap?auto=true")!

/// Reads the widget state written by the JS-side TappWidget.setWidgetData() call.
private func readWidgetState() -> (categoryName: String, colorHex: String) {
    guard
        let defaults = UserDefaults(suiteName: appGroupId),
        let json = defaults.string(forKey: userDefaultsKey),
        let data = json.data(using: .utf8),
        let dict = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    else {
        return ("Tap", "#4A90D9")
    }
    let name = dict["categoryName"] as? String ?? "Tap"
    let color = dict["colorHex"] as? String ?? "#4A90D9"
    return (name, color)
}

struct TappWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> TappWidgetEntry {
        TappWidgetEntry(
            date: Date(),
            categoryName: "Lunch",
            colorHex: "#4CAF50",
            deepLink: deepLinkURL
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (TappWidgetEntry) -> Void) {
        let state = readWidgetState()
        completion(TappWidgetEntry(
            date: Date(),
            categoryName: state.categoryName,
            colorHex: state.colorHex,
            deepLink: deepLinkURL
        ))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<TappWidgetEntry>) -> Void) {
        let state = readWidgetState()
        let entry = TappWidgetEntry(
            date: Date(),
            categoryName: state.categoryName,
            colorHex: state.colorHex,
            deepLink: deepLinkURL
        )
        // Refresh every 30 minutes so the predicted category stays current.
        // The app also calls WidgetCenter.reloadTimelines on foreground and after routine changes.
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}
