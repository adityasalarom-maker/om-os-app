import os

tracker_path = r'c:\Users\adity\Ag Folder\om_os_app\src\components\tracker\DailyTrackerView.tsx'
with open(tracker_path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add isMiniCalendarOpen state
calendar_state_old = "  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());"
calendar_state_new = """  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [isMiniCalendarOpen, setIsMiniCalendarOpen] = useState(false);"""

if calendar_state_old in code and "isMiniCalendarOpen" not in code:
    code = code.replace(calendar_state_old, calendar_state_new, 1)

# 2. Update Date Selector with Mini Calendar Toggle & Popover
old_date_box = """          <div className="flex items-center bg-slate-950/70 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setSelectedDate(new Date(selectedDate.getTime() - 86400000))}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-medium text-slate-200 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>{selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </span>
            <button
              onClick={() => setSelectedDate(new Date(selectedDate.getTime() + 86400000))}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>"""

new_date_box = """          <div className="relative flex items-center rounded-xl p-1 text-xs border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
            <button
              onClick={() => setSelectedDate(new Date(selectedDate.getTime() - 86400000))}
              className="p-1 rounded-lg transition-colors cursor-pointer hover:opacity-80"
              style={{ color: 'var(--text-muted)' }}
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsMiniCalendarOpen(!isMiniCalendarOpen)}
              className="px-3 font-medium flex items-center gap-1.5 cursor-pointer hover:opacity-90 rounded-md py-0.5"
              style={{ color: 'var(--text-main)' }}
              title="Click to open mini calendar picker"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>{selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </button>
            <button
              onClick={() => setSelectedDate(new Date(selectedDate.getTime() + 86400000))}
              className="p-1 rounded-lg transition-colors cursor-pointer hover:opacity-80"
              style={{ color: 'var(--text-muted)' }}
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Collapsible Mini Calendar View Popover */}
            {isMiniCalendarOpen && (
              <div 
                className="absolute top-full mt-2 left-0 z-50 p-3 rounded-2xl border shadow-2xl space-y-3 min-w-[240px] animate-in fade-in zoom-in-95 duration-150"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
              >
                <div className="flex items-center justify-between text-xs font-bold border-b pb-1.5" style={{ color: 'var(--text-main)', borderColor: 'var(--border-color)' }}>
                  <span>Quick Jump</span>
                  <button onClick={() => setIsMiniCalendarOpen(false)} className="text-[10px] px-1.5 py-0.5 rounded border" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>✕</button>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => { setSelectedDate(new Date()); setIsMiniCalendarOpen(false); }}
                    className="px-2 py-1.5 rounded-lg text-xs font-semibold text-center border"
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--accent)' }}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => { setSelectedDate(new Date(Date.now() - 86400000)); setIsMiniCalendarOpen(false); }}
                    className="px-2 py-1.5 rounded-lg text-xs font-medium text-center border"
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                  >
                    Yesterday
                  </button>
                  <button
                    onClick={() => { setSelectedDate(new Date(Date.now() - 86400000 * 2)); setIsMiniCalendarOpen(false); }}
                    className="px-2 py-1.5 rounded-lg text-xs font-medium text-center border"
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                  >
                    2 Days Ago
                  </button>
                  <button
                    onClick={() => { setSelectedDate(new Date(Date.now() - 86400000 * 3)); setIsMiniCalendarOpen(false); }}
                    className="px-2 py-1.5 rounded-lg text-xs font-medium text-center border"
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                  >
                    3 Days Ago
                  </button>
                </div>
                <div className="pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <label className="text-[10px] uppercase font-bold block mb-1" style={{ color: 'var(--text-muted)' }}>Choose Specific Date</label>
                  <input
                    type="date"
                    value={selectedDate.toISOString().split('T')[0]}
                    onChange={(e) => {
                      if (e.target.value) {
                        const [y, m, d] = e.target.value.split('-').map(Number);
                        setSelectedDate(new Date(y, m - 1, d, 12, 0, 0));
                        setIsMiniCalendarOpen(false);
                      }
                    }}
                    className="w-full text-xs p-1.5 rounded-lg border font-mono"
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                  />
                </div>
              </div>
            )}
          </div>"""

# Replace date box
if old_date_box in code:
    code = code.replace(old_date_box, new_date_box)
    print("Replaced Date Selector with Mini Calendar in DailyTrackerView.tsx")
else:
    norm_code = code.replace('\r\n', '\n')
    norm_old = old_date_box.replace('\r\n', '\n')
    if norm_old in norm_code:
        code = norm_code.replace(norm_old, new_date_box)
        print("Replaced Date Selector (normalized) in DailyTrackerView.tsx")
    else:
        print("Date box pattern not found")

with open(tracker_path, 'w', encoding='utf-8') as f:
    f.write(code)
