/**
 * TASK-20: Personal Daily Life Tracker — Core Domain Model & Temporal Engine
 * 
 * Reconciled against Master PRD & User Decision Record (3 November 2026):
 * - Three Capture Modes (Instant Event, Start/Stop Interval, Retrospective Batch)
 * - Half-open intervals [start, end)
 * - Strict non-overlapping Primary timeline + Secondary overlays
 * - Prompt-first primary closure (End at current time vs Set actual earlier end time)
 * - Wake closes Sleep (Wake now vs Retrospective actual wake time)
 * - Hybrid Interruption Model (Secondary overlay vs Primary split)
 * - Decomposed Confidence (CaptureMethod, StartConfidence, EndConfidence, SequenceOrder)
 * - No auto-division of gaps for sequence-only activities
 * - Calendar Day & Wake Cycle projections from single canonical records
 */

// ============================================================================
// 1. CORE DOMAIN TYPES & ENUMS
// ============================================================================

export type CaptureMethod = 'LIVE' | 'RETROSPECTIVE' | 'SYSTEM_DERIVED' | 'IMPORTED';

export type BoundaryConfidence = 'EXACT' | 'ESTIMATED' | 'UNKNOWN';

export type DurationConfidence = 'EXACT' | 'ESTIMATED' | 'UNKNOWN';

export type ActivityKind = 'EVENT' | 'INTERVAL' | 'SEQUENCE_ONLY';

export type ActivityRole = 'PRIMARY' | 'SECONDARY';

export type TimerState = 'RUNNING' | 'PAUSED' | 'STOPPED' | 'NEEDS_REVIEW' | 'CONFLICTED';

export type ReconstructionStatus = 
  | 'FULL' 
  | 'PARTIAL' 
  | 'ESTIMATED' 
  | 'SEQUENCE_ONLY' 
  | 'UNRECONSTRUCTED' 
  | 'NEEDS_REVIEW';

export type UserFacingConfidenceLabel = 
  | 'Exact — Live'
  | 'Exact — Retrospective'
  | 'Estimated'
  | 'Sequence Only'
  | 'Unknown';

export interface ActivityDefinition {
  id: string;
  name: string;
  categoryId?: string;
  defaultMode: 'EVENT' | 'INTERVAL';
  defaultRole: ActivityRole;
  icon?: string;
  color?: string;
  isArchived?: boolean;
  reviewThresholdMinutes?: number; // e.g. 180 min (3h) warning
  createdAt: number;
  updatedAt: number;
}

export interface ActivityOccurrence {
  id: string;
  activityId: string;
  kind: ActivityKind;
  source: CaptureMethod;
  status: TimerState;
  occurredAt?: number; // Epoch ms for instant events or initial anchor
  recordedAt: number;   // Epoch ms when user or system actually recorded
  updatedAt: number;
  timeZone: string;     // IANA time zone identifier, e.g. 'Asia/Kolkata'
  utcOffsetMinutes: number; // Stored offset at capture time
  notes?: string;
}

export interface TimeSegment {
  id: string;
  occurrenceId: string;
  startAt: number;      // Epoch ms (inclusive)
  endAt?: number;       // Epoch ms (exclusive). Undefined if currently RUNNING
  role: ActivityRole;
  startConfidence: BoundaryConfidence;
  endConfidence: BoundaryConfidence;
  durationConfidence?: DurationConfidence;
  sequenceOrder?: number;
  isPaused?: boolean;
}

export interface ReconstructionBatch {
  id: string;
  windowStart: number;
  windowEnd: number;
  occurrenceIds: string[];
  status: ReconstructionStatus;
  createdAt: number;
}

export interface RecordRevision {
  id: string;
  recordId: string;
  recordType: 'OCCURRENCE' | 'SEGMENT' | 'BATCH';
  action: 'CREATE' | 'UPDATE' | 'SPLIT' | 'MERGE' | 'CLOSE' | 'DELETE' | 'RESTORE';
  previousSnapshot?: string; // JSON stringified
  newSnapshot: string;      // JSON stringified
  reason?: string;
  timestamp: number;
}

export interface SyncOperation {
  id: string; // Idempotency UUID
  recordId: string;
  table: string;
  action: 'UPSERT' | 'DELETE';
  payload: string;
  timestamp: number;
  status: 'PENDING' | 'SYNCED' | 'FAILED_RETRYING' | 'CONFLICT';
}

// ============================================================================
// 2. TIMELINE PROJECTION & AUDIT TYPES
// ============================================================================

export interface TimelineGap {
  startAt: number;
  endAt: number;
  durationMs: number;
}

export interface TimelineConflict {
  segmentAId: string;
  segmentBId: string;
  overlapStart: number;
  overlapEnd: number;
  overlapDurationMs: number;
  reason: string;
}

export interface ProjectedSegment {
  occurrenceId: string;
  activityId: string;
  segmentId: string;
  role: ActivityRole;
  startAt: number;
  endAt: number;
  durationMs: number;
  startConfidence: BoundaryConfidence;
  endConfidence: BoundaryConfidence;
  confidenceLabel: UserFacingConfidenceLabel;
  isCrossMidnight?: boolean;
  isRunning?: boolean;
}

export interface DayProjectionReport {
  reportingWindow: {
    start: number;
    end: number;
    type: 'CALENDAR_DAY' | 'WAKE_CYCLE';
    timeZone: string;
  };
  totalWindowDurationMs: number;
  exactPrimaryDurationMs: number;
  estimatedPrimaryDurationMs: number;
  secondaryDurationMs: number;
  untrackedDurationMs: number;
  primarySegments: ProjectedSegment[];
  secondarySegments: ProjectedSegment[];
  untrackedGaps: TimelineGap[];
  conflicts: TimelineConflict[];
}

// ============================================================================
// 3. INTERVAL MATH & OVERLAP LOGIC (HALF-OPEN [start, end))
// ============================================================================

/**
 * Checks if two half-open intervals [aStart, aEnd) and [bStart, bEnd) overlap.
 * Adjacent intervals where aEnd === bStart do NOT overlap.
 */
export function intervalsOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Computes the intersection of two half-open intervals.
 * Returns null if they do not intersect.
 */
export function intervalIntersection(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number
): { start: number; end: number; durationMs: number } | null {
  const start = Math.max(aStart, bStart);
  const end = Math.min(aEnd, bEnd);
  if (start < end) {
    return { start, end, durationMs: end - start };
  }
  return null;
}

/**
 * Finds all primary conflicts between a set of segments.
 * Primary segments must never overlap.
 */
export function detectPrimaryConflicts(segments: TimeSegment[]): TimelineConflict[] {
  const primarySegments = segments.filter(
    (s) => s.role === 'PRIMARY' && s.startAt != null && s.endAt != null && !s.isPaused
  );
  const conflicts: TimelineConflict[] = [];

  for (let i = 0; i < primarySegments.length; i++) {
    for (let j = i + 1; j < primarySegments.length; j++) {
      const a = primarySegments[i];
      const b = primarySegments[j];
      const intersection = intervalIntersection(a.startAt, a.endAt!, b.startAt, b.endAt!);
      if (intersection) {
        conflicts.push({
          segmentAId: a.id,
          segmentBId: b.id,
          overlapStart: intersection.start,
          overlapEnd: intersection.end,
          overlapDurationMs: intersection.durationMs,
          reason: `Primary conflict between segment ${a.id} and ${b.id} over ${intersection.durationMs / 60000} mins`,
        });
      }
    }
  }

  return conflicts;
}

// ============================================================================
// 4. CONFIDENCE DECOMPOSITION & LABELS
// ============================================================================

/**
 * Derives user-facing confidence label from underlying domain dimensions.
 */
export function deriveConfidenceLabel(
  source: CaptureMethod,
  startConf: BoundaryConfidence,
  endConf: BoundaryConfidence,
  kind: ActivityKind
): UserFacingConfidenceLabel {
  if (kind === 'SEQUENCE_ONLY') {
    return 'Sequence Only';
  }

  if (startConf === 'UNKNOWN' && endConf === 'UNKNOWN') {
    return 'Unknown';
  }

  if (startConf === 'ESTIMATED' || endConf === 'ESTIMATED') {
    return 'Estimated';
  }

  if (startConf === 'EXACT' && endConf === 'EXACT') {
    return source === 'LIVE' ? 'Exact — Live' : 'Exact — Retrospective';
  }

  // If one is exact and the other unknown or partial
  return 'Estimated';
}

// ============================================================================
// 5. PRIMARY TIMER CLOSURE & CONFLICT EVALUATION
// ============================================================================

export interface PrimaryStartConflictResolution {
  hasConflict: boolean;
  activeSegment?: TimeSegment;
  activeOccurrenceId?: string;
  proposedAction: 'NONE' | 'PROMPT_CLOSURE';
}

/**
 * Evaluates whether starting a new Primary activity conflicts with an already running Primary timer.
 */
export function evaluatePrimaryStartConflict(
  runningSegments: TimeSegment[],
  _newStartTime: number
): PrimaryStartConflictResolution {
  const activePrimary = runningSegments.find(
    (s) => s.role === 'PRIMARY' && s.endAt === undefined && !s.isPaused
  );

  if (!activePrimary) {
    return { hasConflict: false, proposedAction: 'NONE' };
  }

  return {
    hasConflict: true,
    activeSegment: activePrimary,
    activeOccurrenceId: activePrimary.occurrenceId,
    proposedAction: 'PROMPT_CLOSURE',
  };
}

/**
 * Closes an active Primary timer upon user confirmation.
 * 
 * Case A (End at current time):
 *   closes activeSegment at current time.
 * 
 * Case B (Set actual end time):
 *   closes activeSegment at earlier actualEndTime.
 *   leaves [actualEndTime, newActivityStartTime) as UNTRACKED GAP. Never auto-fills.
 */
export function closePrimaryTimerWithConfirmation(params: {
  activeSegment: TimeSegment;
  closureType: 'CURRENT_TIME' | 'ACTUAL_END_TIME';
  closureTime: number; // Epoch ms
  confidence: BoundaryConfidence;
  newActivityStartTime: number;
}): {
  closedSegment: TimeSegment;
  untrackedGap?: TimelineGap;
} {
  const { activeSegment, closureTime, confidence, newActivityStartTime } = params;

  if (closureTime <= activeSegment.startAt) {
    throw new Error('Closure time cannot be earlier than or equal to segment start time.');
  }

  const closedSegment: TimeSegment = {
    ...activeSegment,
    endAt: closureTime,
    endConfidence: confidence,
  };

  let untrackedGap: TimelineGap | undefined = undefined;

  // If closed at an earlier time (e.g. 12:30 PM) while new activity starts later (1:00 PM),
  // leave 12:30-1:00 PM as Untracked Time
  if (closureTime < newActivityStartTime) {
    untrackedGap = {
      startAt: closureTime,
      endAt: newActivityStartTime,
      durationMs: newActivityStartTime - closureTime,
    };
  }

  return { closedSegment, untrackedGap };
}

// ============================================================================
// 6. WAKE CLOSES SLEEP ENGINE
// ============================================================================

export interface WakeSleepResolution {
  closedSleepSegment: TimeSegment;
  wakeOccurrence: ActivityOccurrence;
  untrackedGap?: TimelineGap;
}

/**
 * Recording Wake while Sleep is running automatically closes Sleep at the selected Wake time.
 * Supports:
 * - 'WAKE_NOW': closes Sleep at current recording time
 * - 'RETROSPECTIVE': closes Sleep at actual earlier wake time, preserving recording time separately
 */
export function recordWakeClosesSleep(params: {
  activeSleepSegment: TimeSegment;
  wakeActivityId: string;
  wakeTime: number;          // Actual occurrence time of wake
  recordingTime: number;      // When the user tapped/entered
  mode: 'WAKE_NOW' | 'RETROSPECTIVE';
  confidence: BoundaryConfidence;
  timeZone: string;
  utcOffsetMinutes: number;
}): WakeSleepResolution {
  const {
    activeSleepSegment,
    wakeActivityId,
    wakeTime,
    recordingTime,
    mode,
    confidence,
    timeZone,
    utcOffsetMinutes,
  } = params;

  if (wakeTime <= activeSleepSegment.startAt) {
    throw new Error('Wake time cannot be before or at Sleep start time.');
  }

  const closedSleepSegment: TimeSegment = {
    ...activeSleepSegment,
    endAt: wakeTime,
    endConfidence: confidence,
  };

  const wakeOccurrence: ActivityOccurrence = {
    id: `occ_wake_${Date.now()}`,
    activityId: wakeActivityId,
    kind: 'EVENT',
    source: mode === 'WAKE_NOW' ? 'LIVE' : 'RETROSPECTIVE',
    status: 'STOPPED',
    occurredAt: wakeTime,
    recordedAt: recordingTime,
    updatedAt: recordingTime,
    timeZone,
    utcOffsetMinutes,
    notes: mode === 'RETROSPECTIVE' ? 'Retrospective wake time' : 'Live wake event',
  };

  let untrackedGap: TimelineGap | undefined = undefined;
  if (wakeTime < recordingTime) {
    untrackedGap = {
      startAt: wakeTime,
      endAt: recordingTime,
      durationMs: recordingTime - wakeTime,
    };
  }

  return { closedSleepSegment, wakeOccurrence, untrackedGap };
}

// ============================================================================
// 7. HYBRID INTERRUPTION ENGINE
// ============================================================================

export type InterruptionHandling = 'SECONDARY_OVERLAY' | 'SPLIT_PRIMARY';

/**
 * Handles an interruption during an ongoing Primary activity.
 * 
 * Option 1: SECONDARY_OVERLAY
 *   The primary activity continues unbroken; the interruption is logged as SECONDARY.
 *   Does not double-count primary time.
 * 
 * Option 2: SPLIT_PRIMARY
 *   The primary activity is stopped at interruptionStart, interruption runs as PRIMARY,
 *   and resuming creates a new segment for the original activity.
 */
export function handleInterruption(params: {
  activePrimarySegment: TimeSegment;
  interruptionActivityId: string;
  interruptionStart: number;
  interruptionEnd: number;
  handling: InterruptionHandling;
  confidence: BoundaryConfidence;
  timeZone: string;
  utcOffsetMinutes: number;
}): {
  modifiedPrimarySegments: TimeSegment[];
  interruptionSegment: TimeSegment;
  interruptionOccurrence: ActivityOccurrence;
} {
  const {
    activePrimarySegment,
    interruptionActivityId,
    interruptionStart,
    interruptionEnd,
    handling,
    confidence,
    timeZone,
    utcOffsetMinutes,
  } = params;

  const interruptionOccurrence: ActivityOccurrence = {
    id: `occ_int_${Date.now()}`,
    activityId: interruptionActivityId,
    kind: 'INTERVAL',
    source: 'LIVE',
    status: 'STOPPED',
    occurredAt: interruptionStart,
    recordedAt: Date.now(),
    updatedAt: Date.now(),
    timeZone,
    utcOffsetMinutes,
  };

  if (handling === 'SECONDARY_OVERLAY') {
    const interruptionSegment: TimeSegment = {
      id: `seg_int_${Date.now()}`,
      occurrenceId: interruptionOccurrence.id,
      startAt: interruptionStart,
      endAt: interruptionEnd,
      role: 'SECONDARY',
      startConfidence: confidence,
      endConfidence: confidence,
    };

    return {
      modifiedPrimarySegments: [activePrimarySegment],
      interruptionSegment,
      interruptionOccurrence,
    };
  } else {
    // SPLIT_PRIMARY
    const part1: TimeSegment = {
      ...activePrimarySegment,
      endAt: interruptionStart,
      endConfidence: confidence,
    };

    const interruptionSegment: TimeSegment = {
      id: `seg_int_${Date.now()}`,
      occurrenceId: interruptionOccurrence.id,
      startAt: interruptionStart,
      endAt: interruptionEnd,
      role: 'PRIMARY',
      startConfidence: confidence,
      endConfidence: confidence,
    };

    const part2: TimeSegment = {
      id: `seg_resumed_${Date.now()}`,
      occurrenceId: activePrimarySegment.occurrenceId,
      startAt: interruptionEnd,
      endAt: activePrimarySegment.endAt, // preserves undefined if running
      role: 'PRIMARY',
      startConfidence: confidence,
      endConfidence: activePrimarySegment.endConfidence,
    };

    return {
      modifiedPrimarySegments: [part1, part2],
      interruptionSegment,
      interruptionOccurrence,
    };
  }
}

// ============================================================================
// 8. RETROSPECTIVE BATCH RECONSTRUCTION (NO EQUAL DIVISION)
// ============================================================================

export interface RetrospectiveActivityInput {
  activityId: string;
  durationMinutes?: number; // Optional! Can be undefined for Sequence Only
  startAt?: number;
  endAt?: number;
  startConfidence?: BoundaryConfidence;
  endConfidence?: BoundaryConfidence;
}

/**
 * Reconstructs a past window.
 * CRITICAL RULE: Never divide a window equally among sequence-only items.
 * If durations are unspecified, they are recorded as SEQUENCE_ONLY with zero duration allocation.
 * Untracked time is preserved honestly.
 */
export function reconstructBatchWindow(params: {
  windowStart: number;
  windowEnd: number;
  activities: RetrospectiveActivityInput[];
  timeZone: string;
  utcOffsetMinutes: number;
}): {
  batch: ReconstructionBatch;
  occurrences: ActivityOccurrence[];
  segments: TimeSegment[];
  untrackedGaps: TimelineGap[];
} {
  const { windowStart, windowEnd, activities, timeZone, utcOffsetMinutes } = params;

  if (windowEnd <= windowStart) {
    throw new Error('Window end must be strictly after window start.');
  }

  const batchId = `batch_${Date.now()}`;
  const now = Date.now();
  const occurrences: ActivityOccurrence[] = [];
  const segments: TimeSegment[] = [];

  let currentCursor = windowStart;
  let hasSequenceOnly = false;
  let hasEstimated = false;

  activities.forEach((act, idx) => {
    const occId = `occ_rec_${now}_${idx}`;
    const isSequenceOnly = act.durationMinutes == null && act.startAt == null && act.endAt == null;

    if (isSequenceOnly) {
      hasSequenceOnly = true;
      occurrences.push({
        id: occId,
        activityId: act.activityId,
        kind: 'SEQUENCE_ONLY',
        source: 'RETROSPECTIVE',
        status: 'STOPPED',
        recordedAt: now,
        updatedAt: now,
        timeZone,
        utcOffsetMinutes,
      });

      segments.push({
        id: `seg_rec_${now}_${idx}`,
        occurrenceId: occId,
        startAt: windowStart,
        endAt: windowStart, // 0 duration
        role: 'PRIMARY',
        startConfidence: 'UNKNOWN',
        endConfidence: 'UNKNOWN',
        sequenceOrder: idx + 1,
      });
    } else {
      // User entered duration or boundaries
      const start = act.startAt ?? currentCursor;
      const durationMs = act.durationMinutes ? act.durationMinutes * 60000 : (act.endAt! - start);
      const end = act.endAt ?? (start + durationMs);

      const startConf = act.startConfidence ?? 'ESTIMATED';
      const endConf = act.endConfidence ?? 'ESTIMATED';
      if (startConf === 'ESTIMATED' || endConf === 'ESTIMATED') {
        hasEstimated = true;
      }

      occurrences.push({
        id: occId,
        activityId: act.activityId,
        kind: 'INTERVAL',
        source: 'RETROSPECTIVE',
        status: 'STOPPED',
        occurredAt: start,
        recordedAt: now,
        updatedAt: now,
        timeZone,
        utcOffsetMinutes,
      });

      segments.push({
        id: `seg_rec_${now}_${idx}`,
        occurrenceId: occId,
        startAt: start,
        endAt: end,
        role: 'PRIMARY',
        startConfidence: startConf,
        endConfidence: endConf,
        durationConfidence: 'ESTIMATED',
        sequenceOrder: idx + 1,
      });

      currentCursor = end;
    }
  });

  // Calculate untracked gaps in the window
  const primarySegments = segments.filter((s) => s.startAt < s.endAt!);
  primarySegments.sort((a, b) => a.startAt - b.startAt);

  const untrackedGaps: TimelineGap[] = [];
  let gapCursor = windowStart;

  for (const seg of primarySegments) {
    if (seg.startAt > gapCursor) {
      untrackedGaps.push({
        startAt: gapCursor,
        endAt: seg.startAt,
        durationMs: seg.startAt - gapCursor,
      });
    }
    gapCursor = Math.max(gapCursor, seg.endAt!);
  }

  if (gapCursor < windowEnd) {
    untrackedGaps.push({
      startAt: gapCursor,
      endAt: windowEnd,
      durationMs: windowEnd - gapCursor,
    });
  }

  let batchStatus: ReconstructionStatus = 'FULL';
  if (hasSequenceOnly && primarySegments.length === 0) {
    batchStatus = 'SEQUENCE_ONLY';
  } else if (hasSequenceOnly || untrackedGaps.length > 0) {
    batchStatus = 'PARTIAL';
  } else if (hasEstimated) {
    batchStatus = 'ESTIMATED';
  }

  const batch: ReconstructionBatch = {
    id: batchId,
    windowStart,
    windowEnd,
    occurrenceIds: occurrences.map((o) => o.id),
    status: batchStatus,
    createdAt: now,
  };

  return { batch, occurrences, segments, untrackedGaps };
}

// ============================================================================
// 9. DAY PROJECTION ENGINE (CALENDAR DAY & WAKE CYCLE)
// ============================================================================

/**
 * Projects canonical occurrences and time segments onto a target reporting window.
 * Supports:
 * - 00:00 to 24:00 Calendar Day
 * - Wake to Wake Cycle
 * Clamps intervals to window boundaries without duplicating source database rows.
 * Separates exact and estimated duration and computes honest untracked gaps.
 */
export function projectDayTimeline(params: {
  windowStart: number;
  windowEnd: number;
  windowType: 'CALENDAR_DAY' | 'WAKE_CYCLE';
  timeZone: string;
  occurrences: ActivityOccurrence[];
  segments: TimeSegment[];
}): DayProjectionReport {
  const { windowStart, windowEnd, windowType, timeZone, occurrences, segments } = params;
  const occMap = new Map<string, ActivityOccurrence>(occurrences.map((o) => [o.id, o]));

  const projectedPrimary: ProjectedSegment[] = [];
  const projectedSecondary: ProjectedSegment[] = [];

  const now = Date.now();
  const maxElapsed = Math.min(now, windowEnd);

  for (const seg of segments) {
    if (seg.isPaused) continue;
    const isRunning = seg.endAt === undefined || seg.endAt === null;
    const effectiveEnd: number = isRunning ? Math.min(now, windowEnd) : (seg.endAt as number);
    
    // Allow fresh running timer (< 1s old) to be included in projection
    if (!isRunning && !intervalsOverlap(seg.startAt, effectiveEnd, windowStart, windowEnd)) {
      continue;
    }
    if (isRunning && (seg.startAt > windowEnd || effectiveEnd < windowStart)) {
      continue;
    }

    const occ = occMap.get(seg.occurrenceId);
    if (!occ) continue;

    const clampedStart = Math.max(seg.startAt, windowStart);
    const clampedEnd = Math.max(clampedStart, Math.min(effectiveEnd, windowEnd));
    const durationMs = Math.max(0, clampedEnd - clampedStart);

    const isCrossMidnight = seg.startAt < windowStart || effectiveEnd > windowEnd;
    const confidenceLabel: UserFacingConfidenceLabel = isRunning
      ? 'Exact — Live'
      : deriveConfidenceLabel(
          occ.source,
          seg.startConfidence,
          seg.endConfidence,
          occ.kind
        );

    const projected: ProjectedSegment = {
      occurrenceId: occ.id,
      activityId: occ.activityId,
      segmentId: seg.id,
      role: seg.role,
      startAt: clampedStart,
      endAt: clampedEnd,
      durationMs,
      startConfidence: seg.startConfidence,
      endConfidence: seg.endConfidence,
      confidenceLabel,
      isCrossMidnight,
      isRunning,
    };

    if (seg.role === 'PRIMARY') {
      projectedPrimary.push(projected);
    } else {
      projectedSecondary.push(projected);
    }
  }

  // Sort primary segments chronologically
  projectedPrimary.sort((a, b) => a.startAt - b.startAt);

  // Compute exact vs estimated primary durations and untracked gaps
  let exactPrimaryDurationMs = 0;
  let estimatedPrimaryDurationMs = 0;
  const untrackedGaps: TimelineGap[] = [];
  let timelineCursor = windowStart;

  for (const seg of projectedPrimary) {
    if (seg.startAt > timelineCursor && timelineCursor < maxElapsed) {
      const gapEnd = Math.min(seg.startAt, maxElapsed);
      if (gapEnd > timelineCursor) {
        untrackedGaps.push({
          startAt: timelineCursor,
          endAt: gapEnd,
          durationMs: gapEnd - timelineCursor,
        });
      }
    }

    if (seg.startConfidence === 'EXACT' && (seg.endConfidence === 'EXACT' || seg.isRunning)) {
      exactPrimaryDurationMs += seg.durationMs;
    } else {
      estimatedPrimaryDurationMs += seg.durationMs;
    }

    timelineCursor = Math.max(timelineCursor, seg.endAt);
  }

  // Only add untracked gap for elapsed past time up to now (do not treat future hours as gaps)
  if (timelineCursor < maxElapsed) {
    untrackedGaps.push({
      startAt: timelineCursor,
      endAt: maxElapsed,
      durationMs: maxElapsed - timelineCursor,
    });
  }

  const secondaryDurationMs = projectedSecondary.reduce((sum, s) => sum + s.durationMs, 0);
  const totalWindowDurationMs = windowEnd - windowStart;
  const untrackedDurationMs = untrackedGaps.reduce((sum, g) => sum + g.durationMs, 0);

  // Check conflicts
  const conflicts = detectPrimaryConflicts(segments);

  return {
    reportingWindow: {
      start: windowStart,
      end: windowEnd,
      type: windowType,
      timeZone,
    },
    totalWindowDurationMs,
    exactPrimaryDurationMs,
    estimatedPrimaryDurationMs,
    secondaryDurationMs,
    untrackedDurationMs,
    primarySegments: projectedPrimary,
    secondarySegments: projectedSecondary,
    untrackedGaps,
    conflicts,
  };
}


// ============================================================================
// 10. CATEGORY TAXONOMY & ANALYTICS INTELLIGENCE (PRD §4.2, §4.9, §6)
// ============================================================================

export interface ActivityCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  description?: string;
}

export const STARTER_CATEGORIES: ActivityCategory[] = [
  { id: 'cat_sleep', name: 'Sleep & Rest', color: '#6366f1', icon: 'Moon', description: 'Night sleep, nap, rest, wake' },
  { id: 'cat_care', name: 'Personal Care', color: '#06b6d4', icon: 'Sparkles', description: 'Washroom, brushing, bath, grooming' },
  { id: 'cat_food', name: 'Food & Drink', color: '#f97316', icon: 'Coffee', description: 'Breakfast, lunch, dinner, tea, snacks' },
  { id: 'cat_physical', name: 'Physical Activities', color: '#10b981', icon: 'Dumbbell', description: 'Walking, exercise, yoga, pranayama' },
  { id: 'cat_mental', name: 'Mental Activities', color: '#8b5cf6', icon: 'Brain', description: 'Meditation, relaxation, reflection' },
  { id: 'cat_work', name: 'Work & Learning', color: '#3b82f6', icon: 'BookOpen', description: 'Office work, study, reading, research' },
  { id: 'cat_household', name: 'Household', color: '#eab308', icon: 'Home', description: 'Cooking, cleaning, shopping' },
  { id: 'cat_social', name: 'Social & Family', color: '#ec4899', icon: 'Users', description: 'Conversation, family time, calls' },
  { id: 'cat_digital', name: 'Digital Activities', color: '#a855f7', icon: 'Smartphone', description: 'Phone, videos, gaming, social media' },
  { id: 'cat_entertainment', name: 'Entertainment', color: '#f43f5e', icon: 'Tv', description: 'Movies, music, hobbies' },
  { id: 'cat_spiritual', name: 'Spiritual Activities', color: '#d946ef', icon: 'Flame', description: 'Prayer, spiritual study, mantra practice' },
  { id: 'cat_other', name: 'Other', color: '#64748b', icon: 'Folder', description: 'Custom activities' },
];

export interface CategoryDistributionItem {
  categoryId: string;
  categoryName: string;
  color: string;
  durationMs: number;
  percentage: number;
  occurrenceCount: number;
}

export function computeCategoryDistribution(
  segments: ProjectedSegment[],
  activities: ActivityDefinition[],
  categories: ActivityCategory[] = STARTER_CATEGORIES
): CategoryDistributionItem[] {
  const actMap = new Map(activities.map(a => [a.id, a]));
  const catMap = new Map(categories.map(c => [c.id, c]));
  const totals = new Map<string, { durationMs: number; count: number }>();

  let totalPrimaryMs = 0;
  for (const seg of segments) {
    if (seg.role !== 'PRIMARY') continue;
    totalPrimaryMs += seg.durationMs;
    const act = actMap.get(seg.activityId);
    const catId = act?.categoryId || 'cat_other';
    const curr = totals.get(catId) || { durationMs: 0, count: 0 };
    curr.durationMs += seg.durationMs;
    curr.count += 1;
    totals.set(catId, curr);
  }

  const result: CategoryDistributionItem[] = [];
  totals.forEach((val, catId) => {
    const cat = catMap.get(catId) || { name: 'Other', color: '#64748b' };
    result.push({
      categoryId: catId,
      categoryName: cat.name,
      color: cat.color,
      durationMs: val.durationMs,
      percentage: totalPrimaryMs > 0 ? Math.round((val.durationMs / totalPrimaryMs) * 100) : 0,
      occurrenceCount: val.count,
    });
  });

  return result.sort((a, b) => b.durationMs - a.durationMs);
}

export interface HourlyDistributionSlot {
  hour: number; // 0 to 23
  label: string; // '00:00', '01:00', ...
  primaryDurationMs: number;
  dominantActivityName?: string;
  dominantCategoryColor?: string;
  isUntracked: boolean;
}

export function computeHourlyDistribution(
  windowStart: number,
  segments: ProjectedSegment[],
  activities: ActivityDefinition[],
  categories: ActivityCategory[] = STARTER_CATEGORIES
): HourlyDistributionSlot[] {
  const slots: HourlyDistributionSlot[] = [];
  const actMap = new Map(activities.map(a => [a.id, a]));
  const catMap = new Map(categories.map(c => [c.id, c]));

  for (let h = 0; h < 24; h++) {
    const slotStart = windowStart + h * 3600000;
    const slotEnd = slotStart + 3600000;
    const label = `${h.toString().padStart(2, '0')}:00`;

    let totalDurationMs = 0;
    let maxSegDuration = 0;
    let dominantName = 'Untracked';
    let dominantColor = '#1e293b';

    for (const seg of segments) {
      if (seg.role !== 'PRIMARY') continue;
      const inter = intervalIntersection(seg.startAt, seg.endAt, slotStart, slotEnd);
      if (inter) {
        totalDurationMs += inter.durationMs;
        if (inter.durationMs > maxSegDuration) {
          maxSegDuration = inter.durationMs;
          const act = actMap.get(seg.activityId);
          dominantName = act?.name || 'Activity';
          const cat = catMap.get(act?.categoryId || 'cat_other');
          dominantColor = cat?.color || '#3b82f6';
        }
      }
    }

    slots.push({
      hour: h,
      label,
      primaryDurationMs: Math.min(3600000, totalDurationMs),
      dominantActivityName: totalDurationMs > 0 ? dominantName : undefined,
      dominantCategoryColor: totalDurationMs > 0 ? dominantColor : undefined,
      isUntracked: totalDurationMs === 0,
    });
  }

  return slots;
}

export interface LifeIntelligenceMetrics {
  wakeTimeStr?: string;
  sleepDurationMs: number;
  deepWorkDurationMs: number;
  physicalCareDurationMs: number;
  mealCount: number;
  totalTrackedMs: number;
  untrackedMs: number;
  completenessPercent: number;
  exactPercent: number;
}

export function computeLifeIntelligenceMetrics(
  report: DayProjectionReport,
  activities: ActivityDefinition[],
  occurrences: ActivityOccurrence[]
): LifeIntelligenceMetrics {
  const actMap = new Map(activities.map(a => [a.id, a]));

  let sleepDurationMs = 0;
  let deepWorkDurationMs = 0;
  let physicalCareDurationMs = 0;
  let mealCount = 0;
  let wakeTimeStr: string | undefined = undefined;

  for (const occ of occurrences) {
    if (occ.activityId === 'act_wake' && occ.occurredAt) {
      wakeTimeStr = new Date(occ.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }

  for (const seg of report.primarySegments) {
    const act = actMap.get(seg.activityId);
    if (!act) continue;
    const catId = act.categoryId || '';
    if (catId === 'cat_sleep' || act.id === 'act_sleep') {
      sleepDurationMs += seg.durationMs;
    } else if (catId === 'cat_work' || act.id === 'act_study') {
      deepWorkDurationMs += seg.durationMs;
    } else if (catId === 'cat_physical' || catId === 'cat_care' || act.id === 'act_exercise' || act.id === 'act_bath') {
      physicalCareDurationMs += seg.durationMs;
    } else if (catId === 'cat_food' || act.name.toLowerCase().includes('breakfast') || act.name.toLowerCase().includes('lunch') || act.name.toLowerCase().includes('dinner')) {
      mealCount += 1;
    }
  }

  const totalTrackedMs = report.exactPrimaryDurationMs + report.estimatedPrimaryDurationMs;
  const completenessPercent = report.totalWindowDurationMs > 0
    ? Math.round((totalTrackedMs / report.totalWindowDurationMs) * 100)
    : 0;
  const exactPercent = totalTrackedMs > 0
    ? Math.round((report.exactPrimaryDurationMs / totalTrackedMs) * 100)
    : 0;

  return {
    wakeTimeStr,
    sleepDurationMs,
    deepWorkDurationMs,
    physicalCareDurationMs,
    mealCount,
    totalTrackedMs,
    untrackedMs: report.untrackedDurationMs,
    completenessPercent,
    exactPercent,
  };
}
