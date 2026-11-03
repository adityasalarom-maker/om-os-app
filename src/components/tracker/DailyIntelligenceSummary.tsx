import React from 'react';
import {
  Sun,
  Moon,
  BookOpen,
  Dumbbell,
  Coffee,
  Clock,
  ShieldCheck,
  TrendingUp,
  Flame,
  Sparkles,
} from 'lucide-react';
import type {
  DayProjectionReport,
  ActivityDefinition,
  ActivityOccurrence,
  ActivityCategory,
} from '../../services/dailyTrackerEngine';
import {
  computeCategoryDistribution,
  computeHourlyDistribution,
  computeLifeIntelligenceMetrics,
  STARTER_CATEGORIES,
} from '../../services/dailyTrackerEngine';

interface DailyIntelligenceSummaryProps {
  report: DayProjectionReport;
  activities: ActivityDefinition[];
  occurrences: ActivityOccurrence[];
  categories?: ActivityCategory[];
}

export function DailyIntelligenceSummary({
  report,
  activities,
  occurrences,
  categories = STARTER_CATEGORIES,
}: DailyIntelligenceSummaryProps) {
  const metrics = computeLifeIntelligenceMetrics(report, activities, occurrences);
  const catDistribution = computeCategoryDistribution(report.primarySegments, activities, categories);
  const hourlySlots = computeHourlyDistribution(report.reportingWindow.start, report.primarySegments, activities, categories);

  const formatDurationMs = (ms: number) => {
    const mins = Math.round(ms / 60000);
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hrs > 0) return `${hrs}h ${remMins}m`;
    return `${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* 1. Life Intelligence Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Wake Time */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-semibold uppercase tracking-wider">
            <Sun className="w-3.5 h-3.5" />
            <span>Wake Up</span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">
            {metrics.wakeTimeStr || '--:--'}
          </div>
          <div className="text-[10px] text-slate-400">Anchor point</div>
        </div>

        {/* Sleep Duration */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-indigo-400 text-[11px] font-semibold uppercase tracking-wider">
            <Moon className="w-3.5 h-3.5" />
            <span>Night Sleep</span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">
            {formatDurationMs(metrics.sleepDurationMs)}
          </div>
          <div className="text-[10px] text-slate-400">Rest & recovery</div>
        </div>

        {/* Deep Work */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-blue-400 text-[11px] font-semibold uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Deep Work</span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">
            {formatDurationMs(metrics.deepWorkDurationMs)}
          </div>
          <div className="text-[10px] text-slate-400">Study & focus</div>
        </div>

        {/* Physical & Care */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold uppercase tracking-wider">
            <Dumbbell className="w-3.5 h-3.5" />
            <span>Physical & Care</span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">
            {formatDurationMs(metrics.physicalCareDurationMs)}
          </div>
          <div className="text-[10px] text-slate-400">Exercise, bath, prana</div>
        </div>

        {/* Meals Logged */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-orange-400 text-[11px] font-semibold uppercase tracking-wider">
            <Coffee className="w-3.5 h-3.5" />
            <span>Nutrition</span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">
            {metrics.mealCount} <span className="text-xs font-normal text-slate-400">meals</span>
          </div>
          <div className="text-[10px] text-slate-400">Food & hydration</div>
        </div>

        {/* Data Completeness */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-purple-400 text-[11px] font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Completeness</span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">
            {metrics.completenessPercent}%
          </div>
          <div className="text-[10px] text-slate-400">{formatDurationMs(metrics.untrackedMs)} untracked</div>
        </div>
      </div>

      {/* 2. 24-Hour Hourly Distribution Heatmap */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <h3 className="font-semibold text-slate-100 text-sm">24-Hour Activity Distribution Strip</h3>
          </div>
          <span className="text-xs text-slate-400">Hourly Dominance Heatmap</span>
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-12 md:grid-cols-24 gap-1.5">
          {hourlySlots.map((slot) => (
            <div
              key={slot.hour}
              style={{
                backgroundColor: slot.isUntracked ? '#0f172a' : slot.dominantCategoryColor,
              }}
              className="h-14 rounded-lg p-1.5 flex flex-col justify-between border border-slate-800 transition-all hover:scale-105 hover:z-10 cursor-pointer shadow-sm group"
              title={`${slot.label}: ${slot.dominantActivityName || 'Untracked'} (${Math.round(slot.primaryDurationMs / 60000)}m)`}
            >
              <span className="text-[8px] font-mono text-white/70">{slot.label.slice(0, 2)}</span>
              <span className="text-[9px] font-bold text-white truncate drop-shadow-sm">
                {slot.dominantActivityName ? slot.dominantActivityName.slice(0, 3) : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Category Allocation Stack & Confidence Gauge */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category Stack */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h4 className="font-semibold text-slate-100 text-xs uppercase tracking-wider text-slate-400">
            Category Time Allocation
          </h4>

          {/* Proportional Multi-Color Bar */}
          <div className="h-4 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
            {catDistribution.map((cat) => (
              <div
                key={cat.categoryId}
                style={{
                  width: `${cat.percentage}%`,
                  backgroundColor: cat.color,
                }}
                className="h-full transition-all hover:brightness-125"
                title={`${cat.categoryName}: ${cat.percentage}% (${formatDurationMs(cat.durationMs)})`}
              />
            ))}
          </div>

          {/* Category List */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {catDistribution.map((cat) => (
              <div key={cat.categoryId} className="flex items-center justify-between text-xs py-1 border-b border-slate-850">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-slate-300">{cat.categoryName}</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="text-slate-200">{formatDurationMs(cat.durationMs)}</span>
                  <span className="text-slate-500 w-8 text-right">{cat.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Quality & Uncertainty Gauge */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h4 className="font-semibold text-slate-100 text-xs uppercase tracking-wider text-slate-400">
            Timing Confidence & Truthfulness Audit
          </h4>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-medium text-emerald-400">Exact — Live Verification</div>
                <div className="text-[10px] text-slate-500">Captured at occurrence using monotonic clock</div>
              </div>
              <span className="font-mono font-bold text-slate-200">
                {formatDurationMs(report.exactPrimaryDurationMs)}
              </span>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-medium text-amber-400">Estimated / Retrospective</div>
                <div className="text-[10px] text-slate-500">Reconstructed with explicit user uncertainty</div>
              </div>
              <span className="font-mono font-bold text-slate-200">
                {formatDurationMs(report.estimatedPrimaryDurationMs)}
              </span>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-400">Untracked Time (Honest Remainder)</div>
                <div className="text-[10px] text-slate-500">Rule AT-08: Zero assumed activity in gaps</div>
              </div>
              <span className="font-mono font-bold text-slate-300">
                {formatDurationMs(report.untrackedDurationMs)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
