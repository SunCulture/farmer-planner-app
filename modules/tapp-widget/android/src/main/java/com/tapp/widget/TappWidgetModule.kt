package com.tapp.widget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

internal const val PREFS_NAME = "TappWidgetPrefs"
internal const val KEY_WIDGET_DATA = "tapp_widget_data"

class TappWidgetModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("TappWidget")

        /**
         * Writes the widget JSON payload to SharedPreferences and notifies every
         * active TappWidgetProvider instance to redraw with the new predicted state.
         *
         * Call this after any routine/category change, on app foreground, or after
         * a tap is logged so the widget color stays in sync.
         *
         * JSON shape (mirrors WidgetState in get-widget-state.ts):
         * { categoryId, categoryName, colorHex, defaultAmount, predictedAt }
         */
        Function("setWidgetData") { json: String ->
            val context = appContext.reactContext
                ?: throw IllegalStateException("TappWidgetModule: reactContext is null")

            context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .edit()
                .putString(KEY_WIDGET_DATA, json)
                .apply()

            // Kick every active widget instance to redraw.
            // The actual AppWidgetProvider lives in the app's own package
            // (written there by the config plugin to share the app's R class),
            // so we resolve the class name dynamically rather than referencing
            // the library's TappWidgetProvider directly.
            val manager = AppWidgetManager.getInstance(context)
            val providerClass = "${context.packageName}.widget.TappWidgetProvider"
            val ids = try {
                manager.getAppWidgetIds(ComponentName(context.packageName, providerClass))
            } catch (_: Exception) { IntArray(0) }
            if (ids.isNotEmpty()) {
                val intent = Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE).apply {
                    putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
                    setClassName(context.packageName, providerClass)
                }
                context.sendBroadcast(intent)
            }
        }

        /** Returns the last written widget data JSON, or null. */
        Function("getWidgetData") {
            val context = appContext.reactContext ?: return@Function null
            getPrefs(context).getString(KEY_WIDGET_DATA, null)
        }
    }

    companion object {
        /** Read the stored widget state JSON. Used by TappWidgetProvider. */
        fun readWidgetData(context: Context): String? =
            getPrefs(context).getString(KEY_WIDGET_DATA, null)

        /** Shared prefs accessor used by both this module and TappWidgetProvider. */
        fun getPrefs(context: Context): SharedPreferences =
            context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }
}
