import os

tracker_path = r'c:\Users\adity\Ag Folder\om_os_app\src\components\tracker\DailyTrackerView.tsx'
with open(tracker_path, 'r', encoding='utf-8') as f:
    code = f.read()

# Let's inspect where DailyTracker_Bar_SubToolbar begins and ends
subtoolbar_marker = '{/* Subsystem Navigation Bar & Action Tools */}'
active_tab_marker = '{activeSubTab === \'TIMELINE\' && ('

pos_sub = code.find(subtoolbar_marker)
pos_tab = code.find(active_tab_marker)

# Also let's inspect where Today's Activity Log is
log_marker = "{/* 4. TODAY'S ACTIVITY LOG */}"
log_end_marker = "{/* Android Widget Contract Reference: 3 Recent Saved Entries */}"

pos_log = code.find(log_marker)
pos_log_end = code.find(log_end_marker)

print(f"subtoolbar: {pos_sub}, tab: {pos_tab}, log: {pos_log}, log_end: {pos_log_end}")
