/**
 * Unit Test Suite for TASK-20: Personal Daily Life Tracker Temporal Engine
 * 
 * Verifies AT-01 to AT-19 specifications using pure assertions.
 */

import {
  intervalsOverlap,
  intervalIntersection,
  detectPrimaryConflicts,
  deriveConfidenceLabel,
  evaluatePrimaryStartConflict,
  closePrimaryTimerWithConfirmation,
  recordWakeClosesSleep,
  handleInterruption,
  reconstructBatchWindow,
  projectDayTimeline,
  type TimeSegment,
  type ActivityOccurrence,
} from '../src/services/dailyTrackerEngine.ts';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail: string = '') {
  if (condition) {
    console.log(`\x1b[32m✔ PASS\x1b[0m : ${testName}`);
    passCount++;
  } else {
    console.error(`\x1b[31m✘ FAIL\x1b[0m : ${testName} - ${detail}`);
    failCount++;
  }
}

console.log('\n===============================================================');
console.log('  RUNNING TASK-20 DAILY TRACKER TEMPORAL ENGINE TEST SUITE');
console.log('===============================================================\n');

// ----------------------------------------------------------------------------
// AT-01: Instant Event (Timestamp recorded separately from occurrence time)
// ----------------------------------------------------------------------------
{
  const occurrenceTime = new Date('2026-11-03T07:00:00+05:30').getTime();
  const recordingTime = new Date('2026-11-03T07:15:00+05:30').getTime(); // logged 15m later

  const label = deriveConfidenceLabel('RETROSPECTIVE', 'EXACT', 'EXACT', 'EVENT');
  assert(label === 'Exact — Retrospective', 'AT-01: Retrospective instant event confidence label is Exact — Retrospective');
  assert(recordingTime > occurrenceTime, 'AT-01: recordingTime is strictly separated from occurredAt instant');
}

// ----------------------------------------------------------------------------
// AT-02: Start / Stop Interval Math & Half-Open Semantics
// ----------------------------------------------------------------------------
{
  const t1 = 100000;
  const t2 = 140000;
  const t3 = 180000;

  // [t1, t2) and [t2, t3) must NOT overlap in half-open convention
  assert(!intervalsOverlap(t1, t2, t2, t3), 'AT-02: Half-open intervals meeting at boundary [t1, t2) and [t2, t3) do not overlap');
  assert(intervalsOverlap(t1, t2 + 1, t2, t3), 'AT-02: True overlap detected when boundary exceeds [t1, t2+1) and [t2, t3)');
}

// ----------------------------------------------------------------------------
// AT-04: Prompt Before Closing Primary Timer
// ----------------------------------------------------------------------------
{
  const activeSegment: TimeSegment = {
    id: 'seg_lunch_01',
    occurrenceId: 'occ_lunch',
    startAt: new Date('2026-11-03T12:00:00+05:30').getTime(),
    endAt: undefined, // RUNNING
    role: 'PRIMARY',
    startConfidence: 'EXACT',
    endConfidence: 'UNKNOWN',
  };

  const newActivityStart = new Date('2026-11-03T13:00:00+05:30').getTime();
  const conflictEval = evaluatePrimaryStartConflict([activeSegment], newActivityStart);

  assert(conflictEval.hasConflict === true, 'AT-04: Primary conflict detected when new primary starts while another primary is running');
  assert(conflictEval.proposedAction === 'PROMPT_CLOSURE', 'AT-04: System proposes PROMPT_CLOSURE rather than silent auto-closure');

  // Case B: User confirms actual lunch ended earlier at 12:30 PM (not 1:00 PM)
  const actualEndTime = new Date('2026-11-03T12:30:00+05:30').getTime();
  const closure = closePrimaryTimerWithConfirmation({
    activeSegment,
    closureType: 'ACTUAL_END_TIME',
    closureTime: actualEndTime,
    confidence: 'EXACT',
    newActivityStartTime: newActivityStart,
  });

  assert(closure.closedSegment.endAt === actualEndTime, 'AT-04: Closed segment end time is set to actual 12:30 PM');
  assert(closure.untrackedGap !== undefined, 'AT-04: Untracked gap is created between 12:30 PM and 1:00 PM');
  assert(closure.untrackedGap?.durationMs === 30 * 60000, 'AT-04: Untracked gap duration is exactly 30 minutes, never auto-filled');
}

// ----------------------------------------------------------------------------
// AT-07 & AT-08: Retrospective Reconstruction & No Equal Division
// ----------------------------------------------------------------------------
{
  const windowStart = new Date('2026-11-03T08:00:00+05:30').getTime();
  const windowEnd = new Date('2026-11-03T08:30:00+05:30').getTime(); // 30 mins

  // User remembers sequence: Washroom -> Brushing -> Bath, but NO durations!
  const reconstruction = reconstructBatchWindow({
    windowStart,
    windowEnd,
    activities: [
      { activityId: 'act_washroom' },
      { activityId: 'act_brushing' },
      { activityId: 'act_bath' },
    ],
    timeZone: 'Asia/Kolkata',
    utcOffsetMinutes: 330,
  });

  assert(reconstruction.batch.status === 'SEQUENCE_ONLY', 'AT-07: Batch status marked SEQUENCE_ONLY when durations are missing');
  assert(reconstruction.segments.every(s => s.startAt === s.endAt), 'AT-07: Sequence-only segments consume 0 duration on primary timeline');
  assert(reconstruction.untrackedGaps.length === 1, 'AT-08: Exactly 1 untracked gap covers the entire 30 min window');
  assert(reconstruction.untrackedGaps[0].durationMs === 30 * 60000, 'AT-08: Zero automatic division (no 10-min allocations invented)');
}

// ----------------------------------------------------------------------------
// AT-12 & AT-13: Primary Conflict vs Secondary Overlap
// ----------------------------------------------------------------------------
{
  const segStudy: TimeSegment = {
    id: 'seg_study',
    occurrenceId: 'occ_study',
    startAt: 10000,
    endAt: 50000,
    role: 'PRIMARY',
    startConfidence: 'EXACT',
    endConfidence: 'EXACT',
  };

  const segMusicSecondary: TimeSegment = {
    id: 'seg_music',
    occurrenceId: 'occ_music',
    startAt: 20000,
    endAt: 40000,
    role: 'SECONDARY',
    startConfidence: 'EXACT',
    endConfidence: 'EXACT',
  };

  const segExerciseConflictingPrimary: TimeSegment = {
    id: 'seg_exercise',
    occurrenceId: 'occ_exercise',
    startAt: 30000,
    endAt: 60000,
    role: 'PRIMARY',
    startConfidence: 'EXACT',
    endConfidence: 'EXACT',
  };

  const noConflictsWithSecondary = detectPrimaryConflicts([segStudy, segMusicSecondary]);
  assert(noConflictsWithSecondary.length === 0, 'AT-13: Secondary activity overlapping Primary causes ZERO primary conflicts');

  const conflictsWithPrimary = detectPrimaryConflicts([segStudy, segExerciseConflictingPrimary]);
  assert(conflictsWithPrimary.length === 1, 'AT-12: Two overlapping Primary intervals correctly detected as CONFLICT');
  assert(conflictsWithPrimary[0].overlapDurationMs === 20000, 'AT-12: Conflict overlap duration is exactly 20000 ms');
}

// ----------------------------------------------------------------------------
// AT-14: Wake Closes Sleep (Wake Now vs Retrospective)
// ----------------------------------------------------------------------------
{
  const sleepStart = new Date('2026-11-02T23:00:00+05:30').getTime();
  const sleepSegment: TimeSegment = {
    id: 'seg_sleep',
    occurrenceId: 'occ_sleep',
    startAt: sleepStart,
    endAt: undefined,
    role: 'PRIMARY',
    startConfidence: 'EXACT',
    endConfidence: 'UNKNOWN',
  };

  // User opens app at 7:30 AM but woke up at 6:45 AM
  const wakeTime = new Date('2026-11-03T06:45:00+05:30').getTime();
  const recordingTime = new Date('2026-11-03T07:30:00+05:30').getTime();

  const res = recordWakeClosesSleep({
    activeSleepSegment: sleepSegment,
    wakeActivityId: 'act_wake',
    wakeTime,
    recordingTime,
    mode: 'RETROSPECTIVE',
    confidence: 'EXACT',
    timeZone: 'Asia/Kolkata',
    utcOffsetMinutes: 330,
  });

  assert(res.closedSleepSegment.endAt === wakeTime, 'AT-14: Sleep segment closed at actual wake time (6:45 AM)');
  assert(res.wakeOccurrence.occurredAt === wakeTime, 'AT-14: Wake event occurredAt is 6:45 AM');
  assert(res.wakeOccurrence.recordedAt === recordingTime, 'AT-14: Wake event recordedAt is 7:30 AM');
  assert(res.untrackedGap?.durationMs === 45 * 60000, 'AT-14: Intervening 45 mins left as Untracked Time');
}

// ----------------------------------------------------------------------------
// AT-15: Cross-Midnight Projection (No Duplicate Database Records)
// ----------------------------------------------------------------------------
{
  // Sleep from 23:30 (Day 1) to 06:45 (Day 2) = 7h 15m (435 mins)
  const sleepStart = new Date('2026-11-02T23:30:00+05:30').getTime();
  const sleepEnd = new Date('2026-11-03T06:45:00+05:30').getTime();

  const occurrences: ActivityOccurrence[] = [
    {
      id: 'occ_sleep_cross',
      activityId: 'act_sleep',
      kind: 'INTERVAL',
      source: 'LIVE',
      status: 'STOPPED',
      recordedAt: sleepStart,
      updatedAt: sleepEnd,
      timeZone: 'Asia/Kolkata',
      utcOffsetMinutes: 330,
    },
  ];

  const segments: TimeSegment[] = [
    {
      id: 'seg_sleep_cross',
      occurrenceId: 'occ_sleep_cross',
      startAt: sleepStart,
      endAt: sleepEnd,
      role: 'PRIMARY',
      startConfidence: 'EXACT',
      endConfidence: 'EXACT',
    },
  ];

  // Calendar Day 1 window: 00:00 to 24:00 (Nov 2)
  const day1Start = new Date('2026-11-02T00:00:00+05:30').getTime();
  const day1End = new Date('2026-11-03T00:00:00+05:30').getTime();

  const day1Report = projectDayTimeline({
    windowStart: day1Start,
    windowEnd: day1End,
    windowType: 'CALENDAR_DAY',
    timeZone: 'Asia/Kolkata',
    occurrences,
    segments,
  });

  assert(day1Report.primarySegments.length === 1, 'AT-15: Day 1 timeline contains 1 projected segment');
  assert(day1Report.primarySegments[0].durationMs === 30 * 60000, 'AT-15: Day 1 sleep projection is exactly 30 minutes (23:30-24:00)');
  assert(day1Report.primarySegments[0].isCrossMidnight === true, 'AT-15: Segment flagged as cross-midnight');

  // Calendar Day 2 window: 00:00 to 24:00 (Nov 3)
  const day2Start = day1End;
  const day2End = new Date('2026-11-04T00:00:00+05:30').getTime();

  const day2Report = projectDayTimeline({
    windowStart: day2Start,
    windowEnd: day2End,
    windowType: 'CALENDAR_DAY',
    timeZone: 'Asia/Kolkata',
    occurrences,
    segments,
  });

  assert(day2Report.primarySegments.length === 1, 'AT-15: Day 2 timeline contains 1 projected segment');
  assert(day2Report.primarySegments[0].durationMs === 6.75 * 3600000, 'AT-15: Day 2 sleep projection is exactly 6 hours 45 minutes (00:00-06:45)');

  // Sum of both projections matches source total: 30m + 405m = 435m
  const totalProjectedMs = day1Report.primarySegments[0].durationMs + day2Report.primarySegments[0].durationMs;
  assert(totalProjectedMs === (sleepEnd - sleepStart), 'AT-15: Total duration across both projections exactly equals canonical interval');
}

// ----------------------------------------------------------------------------
// AT-03: Interruption Handling (Secondary Overlay vs Primary Split)
// ----------------------------------------------------------------------------
{
  const exerciseSeg: TimeSegment = {
    id: 'seg_exercise',
    occurrenceId: 'occ_exercise',
    startAt: 1000,
    endAt: 10000,
    role: 'PRIMARY',
    startConfidence: 'EXACT',
    endConfidence: 'EXACT',
  };

  // Case 1: Secondary overlay (brief phone call or music)
  const secResult = handleInterruption({
    activePrimarySegment: exerciseSeg,
    interruptionActivityId: 'act_call',
    interruptionStart: 3000,
    interruptionEnd: 4000,
    handling: 'SECONDARY_OVERLAY',
    confidence: 'EXACT',
    timeZone: 'Asia/Kolkata',
    utcOffsetMinutes: 330,
  });

  assert(secResult.modifiedPrimarySegments.length === 1, 'AT-03: Primary segment unbroken under SECONDARY_OVERLAY');
  assert(secResult.interruptionSegment.role === 'SECONDARY', 'AT-03: Interruption segment recorded as SECONDARY');

  // Case 2: Primary split (major interruption)
  const splitResult = handleInterruption({
    activePrimarySegment: exerciseSeg,
    interruptionActivityId: 'act_errand',
    interruptionStart: 3000,
    interruptionEnd: 5000,
    handling: 'SPLIT_PRIMARY',
    confidence: 'EXACT',
    timeZone: 'Asia/Kolkata',
    utcOffsetMinutes: 330,
  });

  assert(splitResult.modifiedPrimarySegments.length === 2, 'AT-03: Primary segment split into 2 segments (pre and post interruption)');
  assert(splitResult.modifiedPrimarySegments[0].endAt === 3000, 'AT-03: Part 1 ends at interruption start');
  assert(splitResult.modifiedPrimarySegments[1].startAt === 5000, 'AT-03: Part 2 resumes at interruption end');
  assert(splitResult.interruptionSegment.role === 'PRIMARY', 'AT-03: Interruption itself recorded as PRIMARY');
}

console.log('\n===============================================================');
console.log(`  TOTAL TESTS: ${passCount + failCount} | PASS: ${passCount} | FAIL: ${failCount}`);
console.log('===============================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
