package com.omknowledge.os;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.SystemClock;
import android.widget.RemoteViews;

/**
 * TASK-20: Personal Daily Life Tracker — Android Native AppWidgetProvider
 * 
 * Invariants:
 * 1. Dedicated ongoing timer panel with Chronometer (uses SystemClock.elapsedRealtime()).
 *    Zero 1-minute background app polling.
 * 2. 3 Most recent completed/saved entries list (active timer does not displace slots).
 * 3. Expandable quick action buttons bridging to MainActivity.
 */
public class DailyTrackerWidgetProvider extends AppWidgetProvider {

    public static final String ACTION_WAKE = "com.omknowledge.os.ACTION_WAKE";
    public static final String ACTION_STOP_TIMER = "com.omknowledge.os.ACTION_STOP_TIMER";
    public static final String ACTION_REFRESH_WIDGET = "com.omknowledge.os.ACTION_REFRESH_WIDGET";

    private static final String PREFS_NAME = "OmDailyTrackerPrefs";
    private static final String KEY_IS_RUNNING = "isTimerRunning";
    private static final String KEY_ACTIVE_TITLE = "activeTimerTitle";
    private static final String KEY_START_ELAPSED = "timerStartElapsedRealtime";
    private static final String KEY_RECENT_1 = "recentEntry1";
    private static final String KEY_RECENT_2 = "recentEntry2";
    private static final String KEY_RECENT_3 = "recentEntry3";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.daily_tracker_widget_layout);
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        boolean isRunning = prefs.getBoolean(KEY_IS_RUNNING, true);
        String activeTitle = prefs.getString(KEY_ACTIVE_TITLE, "Deep Study / Work");
        long startElapsed = prefs.getLong(KEY_START_ELAPSED, SystemClock.elapsedRealtime() - (45 * 60 * 1000));

        // 1. Ongoing Timer & Chronometer Setup (Monotonic elapsedRealtime base)
        views.setTextViewText(R.id.widget_active_title, activeTitle);
        if (isRunning) {
            views.setChronometer(R.id.widget_chronometer, startElapsed, "%s", true);
        } else {
            views.setChronometer(R.id.widget_chronometer, SystemClock.elapsedRealtime(), "00:00", false);
        }

        // 2. 3 Recent Saved Entries
        String recent1 = prefs.getString(KEY_RECENT_1, "1. Wake Up — 06:45 AM (Exact)");
        String recent2 = prefs.getString(KEY_RECENT_2, "2. Bath — 07:10 AM - 07:35 AM (25m)");
        String recent3 = prefs.getString(KEY_RECENT_3, "3. Breakfast — 08:00 AM (40m)");

        views.setTextViewText(R.id.widget_recent_1, recent1);
        views.setTextViewText(R.id.widget_recent_2, recent2);
        views.setTextViewText(R.id.widget_recent_3, recent3);

        // 3. Pending Intents for Actions
        Intent mainIntent = new Intent(context, MainActivity.class);
        PendingIntent mainPendingIntent = PendingIntent.getActivity(
                context, 0, mainIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.btn_action_open, mainPendingIntent);
        views.setOnClickPendingIntent(R.id.widget_title, mainPendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (ACTION_REFRESH_WIDGET.equals(intent.getAction()) ||
            ACTION_WAKE.equals(intent.getAction()) ||
            ACTION_STOP_TIMER.equals(intent.getAction())) {

            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
            ComponentName thisWidget = new ComponentName(context, DailyTrackerWidgetProvider.class);
            int[] appWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget);
            onUpdate(context, appWidgetManager, appWidgetIds);
        }
    }
}
