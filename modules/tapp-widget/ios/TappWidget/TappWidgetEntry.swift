import WidgetKit

/// Timeline entry carrying the predicted category data for one widget render.
struct TappWidgetEntry: TimelineEntry {
    let date: Date
    let categoryName: String
    let colorHex: String
    let deepLink: URL
}
