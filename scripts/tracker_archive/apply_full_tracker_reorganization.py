import os

tracker_path = r'c:\Users\adity\Ag Folder\om_os_app\src\components\tracker\DailyTrackerView.tsx'
with open(tracker_path, 'r', encoding='utf-8') as f:
    code = f.read()

subtoolbar_marker = '{/* Subsystem Navigation Bar & Action Tools */}'
timeline_tab_marker = "{activeSubTab === 'TIMELINE' && ("
hero_timer_marker = '{/* 1. ACTIVE RUNNING TIMER (Matte, clean solid green without glowing or pinging) */}'
drawer_marker = '{/* 2. DEDICATED START BUTTON & ANIMATED UNFOLDING CATEGORY DRAWER */}'
canvas_marker = '{/* 3. 24-HOUR CONTINUOUS HORIZON CANVAS */}'

pos_sub = code.find(subtoolbar_marker)
pos_tab = code.find(timeline_tab_marker)
pos_timer = code.find(hero_timer_marker)
pos_drawer = code.find(drawer_marker)
pos_canvas = code.find(canvas_marker)

# Extract Drawer and Timer
drawer_code = code[pos_drawer:pos_canvas]
timer_code = code[pos_timer:pos_drawer]

right_panel = """        {/* Right Column (lg:col-span-5): 2 Parallel Vertical Sections */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-3">
          {/* Vertical Section 1: Views & Analytics */}
          <div className="p-4 rounded-2xl border flex flex-col justify-between space-y-2.5 transition-colors" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Views & Analytics</span>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Switch tracker perspective</p>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => setActiveSubTab('TIMELINE')}
                className={`w-full p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  activeSubTab === 'TIMELINE' ? 'bg-indigo-600 text-white shadow-md' : 'border'
                }`}
                style={activeSubTab !== 'TIMELINE' ? { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-main)' } : undefined}
              >
                <Clock size={15} />
                <span>24h Timeline</span>
              </button>
              <button
                onClick={() => setActiveSubTab('INTELLIGENCE')}
                className={`w-full p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  activeSubTab === 'INTELLIGENCE' ? 'bg-indigo-600 text-white shadow-md' : 'border'
                }`}
                style={activeSubTab !== 'INTELLIGENCE' ? { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-main)' } : undefined}
              >
                <TrendingUp size={15} />
                <span>Time Intelligence</span>
              </button>
            </div>
            <button
              onClick={() => setIsRecoveryOpen(true)}
              className="w-full p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 border transition-all cursor-pointer hover:opacity-90"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
            >
              <ShieldAlert size={14} className="text-rose-500" />
              <span>Recovery & Backup</span>
            </button>
          </div>

          {/* Vertical Section 2: Assistant & Seed */}
          <div className="p-4 rounded-2xl border flex flex-col justify-between space-y-2.5 transition-colors" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Assistant & Seeds</span>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Autoclean & load demo</p>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => setIsGapReviewOpen(true)}
                className="w-full p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border-amber-500/30"
              >
                <Sparkles size={15} />
                <span>Review Gaps ({projection.untrackedGaps.length})</span>
              </button>
              <button
                onClick={() => setIsCatalogOpen(true)}
                className="w-full p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 border transition-all cursor-pointer hover:opacity-90"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
              >
                <Layers size={15} className="text-indigo-400" />
                <span>Catalog ({allCategories.length})</span>
              </button>
            </div>
            <button
              onClick={async () => {
                const res = await seedTracker3DayMockData(true);
                showToast(res.message);
              }}
              className="w-full p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border-emerald-500/30"
              title="Seed 3 days of historical tracking data + today"
            >
              <span>🌱 Seed 3-Day Demo</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW TAB 1: 24h Timeline & Quick Capture */}
      {activeSubTab === 'TIMELINE' && (
        <div className="space-y-6">
"""

new_upper_section = """      {/* Upper Cockpit Grid: Left = Start Activity/Timer & Presets; Right = 2 Parallel Vertical Action Columns (User Comments 2 & 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (lg:col-span-7): Start Activity / Timer & 1-Tap Presets & Drawer */}
        <div className="lg:col-span-7 space-y-4">
""" + timer_code + drawer_code + """        </div>
""" + right_panel

# Replace upper section
code = code[:pos_sub] + new_upper_section + code[pos_canvas:]

# Now replace Today's Activity Log
log_marker = "{/* 4. TODAY'S ACTIVITY LOG */}"
log_end_marker = "{/* Android Widget Contract Reference: 3 Recent Saved Entries */}"
p_log = code.find(log_marker)
p_log_end = code.find(log_end_marker)

new_activity_log = """{/* 4. TODAY'S ACTIVITY LOG (Bounded 4-line high-density scroll container - User Comment 5) */}
          <div data-ag-id="DailyTracker_List_ChronologicalSegments" className="border rounded-2xl p-4 sm:p-5 space-y-3 transition-colors" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-main)' }}>
                  Today's Activity Log ({projection.primarySegments.length} Segments Logged)
                </span>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Click any entry to inspect or split. Exactly 4 lines visible with smooth vertical scroll.
                </p>
              </div>
              {projection.untrackedGaps.length > 0 ? (
                <button
                  onClick={() => setIsGapReviewOpen(true)}
                  className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{projection.untrackedGaps.length} Gaps to Fill</span>
                </button>
              ) : (
                <span className="text-xs text-emerald-500 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>100% Complete</span>
                </span>
              )}
            </div>

            {/* Bounded Container: ~4 rows visible without scroll, smooth scroll for the rest */}
            <div className="max-h-[250px] overflow-y-auto space-y-1.5 pr-1.5 custom-scrollbar">
              {projection.primarySegments.map((seg) => {
                const act = activities.find((a) => a.id === seg.activityId);
                const isRunning = seg.isRunning || seg.endAt == null;
                const startTimeStr = new Date(seg.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const endTimeStr = isRunning ? 'Running Now' : new Date(seg.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const durationMins = Math.max(1, Math.round(seg.durationMs / 60000));
                const hours = Math.floor(durationMins / 60);
                const mins = durationMins % 60;
                const durStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                const cat = allCategories.find((c) => c.id === act?.categoryId);

                return (
                  <div
                    key={seg.segmentId}
                    onClick={() => setSelectedSegmentForEdit(seg)}
                    className={`flex items-center justify-between p-2.5 px-3.5 rounded-xl border cursor-pointer transition-all hover:opacity-95 ${
                      isRunning
                        ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/20'
                        : ''
                    }`}
                    style={!isRunning ? { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' } : undefined}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: isRunning ? '#10b981' : (cat?.color || 'var(--accent)') }}
                      />
                      <div className="flex items-center gap-2 min-w-0 truncate">
                        <span className="text-xs font-bold truncate" style={{ color: 'var(--text-main)' }}>
                          {act?.name || 'Activity'}
                        </span>
                        {cat && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-md font-medium border shrink-0 hidden sm:inline" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                            {cat.name}
                          </span>
                        )}
                        {isRunning && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 font-semibold shrink-0">
                            LIVE
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-xs">
                      <span className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {startTimeStr} – {endTimeStr}
                      </span>
                      <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--accent)' }}>
                        {durStr}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border hidden md:inline" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                        {seg.confidenceLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          """

code = code[:p_log] + new_activity_log + code[p_log_end:]

with open(tracker_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Applied full tracker reorganization successfully")
