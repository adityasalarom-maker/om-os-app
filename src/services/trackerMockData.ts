import { db } from '../db';
import type { ActivityDefinition, ActivityOccurrence, TimeSegment } from './dailyTrackerEngine';

export const CANONICAL_ACTIVITIES: ActivityDefinition[] = [
  // Sleep & Rest
  { id: 'act_sleep', name: 'Night Sleep', categoryId: 'cat_sleep', defaultMode: 'INTERVAL', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },
  { id: 'act_nap', name: 'Afternoon Nap', categoryId: 'cat_sleep', defaultMode: 'INTERVAL', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },
  { id: 'act_wake', name: 'Wake Up', categoryId: 'cat_sleep', defaultMode: 'EVENT', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },

  // Morning Routine
  { id: 'act_morning', name: 'Morning Routine', categoryId: 'cat_morning', defaultMode: 'INTERVAL', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },
  { id: 'act_water', name: 'Warm Water / Detox', categoryId: 'cat_morning', defaultMode: 'EVENT', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },

  // Deep Work & Study
  { id: 'act_study', name: 'Deep Study / Work', categoryId: 'cat_work', defaultMode: 'INTERVAL', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },
  { id: 'act_coding', name: 'Architecture & Coding', categoryId: 'cat_work', defaultMode: 'INTERVAL', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },
  { id: 'act_research', name: 'Research & Reading', categoryId: 'cat_work', defaultMode: 'INTERVAL', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },

  // Nutrition & Eating
  { id: 'act_breakfast', name: 'Breakfast', categoryId: 'cat_food', defaultMode: 'INTERVAL', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },
  { id: 'act_lunch', name: 'Lunch', categoryId: 'cat_food', defaultMode: 'INTERVAL', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },
  { id: 'act_tea', name: 'Tea & Snacks', categoryId: 'cat_food', defaultMode: 'INTERVAL', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },
  { id: 'act_dinner', name: 'Dinner', categoryId: 'cat_food', defaultMode: 'INTERVAL', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },

  // Personal Care & Hygiene
  { id: 'act_bath', name: 'Bath', categoryId: 'cat_care', defaultMode: 'INTERVAL', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },
  { id: 'act_washroom', name: 'Washroom & Hygiene', categoryId: 'cat_care', defaultMode: 'INTERVAL', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },
  { id: 'act_medicine', name: 'Medicine', categoryId: 'cat_care', defaultMode: 'EVENT', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },

  // Health & Fitness
  { id: 'act_exercise', name: 'Exercise & Yoga', categoryId: 'cat_fitness', defaultMode: 'INTERVAL', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },
  { id: 'act_pranayama', name: 'Pranayama & Meditation', categoryId: 'cat_fitness', defaultMode: 'INTERVAL', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },
  { id: 'act_walk', name: 'Evening Walk', categoryId: 'cat_fitness', defaultMode: 'INTERVAL', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },

  // Leisure & Media
  { id: 'act_music', name: 'Music / Audio', categoryId: 'cat_leisure', defaultMode: 'INTERVAL', defaultRole: 'SECONDARY', createdAt: 0, updatedAt: 0 },
  { id: 'act_leisure_reading', name: 'Leisure Reading', categoryId: 'cat_leisure', defaultMode: 'INTERVAL', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },

  // Social & Communication
  { id: 'act_family', name: 'Family Time', categoryId: 'cat_social', defaultMode: 'INTERVAL', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },
  { id: 'act_calls', name: 'Calls & Catchup', categoryId: 'cat_social', defaultMode: 'INTERVAL', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },

  // Travel & Commute
  { id: 'act_commute', name: 'Commute / Travel', categoryId: 'cat_travel', defaultMode: 'INTERVAL', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },

  // Household & Errands
  { id: 'act_errands', name: 'Household Errands', categoryId: 'cat_chores', defaultMode: 'INTERVAL', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },
  { id: 'act_cleaning', name: 'Room Organizing', categoryId: 'cat_chores', defaultMode: 'INTERVAL', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },

  // Unproductive / Distracted
  { id: 'act_scrolling', name: 'Phone Scrolling', categoryId: 'cat_distracted', defaultMode: 'INTERVAL', defaultRole: 'PRIMARY', createdAt: 0, updatedAt: 0 },
];

/**
 * Seeds 3 full days of historical mock data (Yesterday, 2 days ago, 3 days ago).
 * Ensures all categories have assigned activities and rich visual timelines.
 */
export async function seedTracker3DayMockData(force: boolean = false): Promise<{ addedCount: number; message: string }> {
  try {
    // 1. Ensure all canonical activities exist with their categoryId
    await db.activities.bulkPut(CANONICAL_ACTIVITIES);

    // Check if historical mock data is already present
    const existingCount = await db.activityOccurrences.count();
    if (!force && existingCount > 10) {
      return { addedCount: 0, message: 'Historical tracking data already exists.' };
    }

    const occurrences: ActivityOccurrence[] = [];
    const segments: TimeSegment[] = [];

    // Helper to generate a day's schedule
    const createDaySchedule = (dayOffset: number) => {
      const now = new Date();
      // Year, Month, Date - dayOffset
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOffset);
      const year = d.getFullYear();
      const month = d.getMonth();
      const date = d.getDate();

      const timeAt = (hours: number, minutes: number) => {
        return new Date(year, month, date, hours, minutes, 0, 0).getTime();
      };

      const daySchedule = [
        // 00:00 - 06:30 : Night Sleep
        { actId: 'act_sleep', startH: 0, startM: 0, endH: 6, endM: 30, role: 'PRIMARY' as const },
        // 06:30 - 07:00 : Washroom & Hygiene
        { actId: 'act_washroom', startH: 6, startM: 30, endH: 7, endM: 0, role: 'PRIMARY' as const },
        // 07:00 - 07:35 : Bath
        { actId: 'act_bath', startH: 7, startM: 0, endH: 7, endM: 35, role: 'PRIMARY' as const },
        // 07:35 - 08:30 : Exercise & Yoga
        { actId: 'act_exercise', startH: 7, startM: 35, endH: 8, endM: 30, role: 'PRIMARY' as const },
        // 08:30 - 09:15 : Breakfast
        { actId: 'act_breakfast', startH: 8, startM: 30, endH: 9, endM: 15, role: 'PRIMARY' as const },
        // 09:15 - 13:00 : Deep Study / Work
        { actId: 'act_study', startH: 9, startM: 15, endH: 13, endM: 0, role: 'PRIMARY' as const },
        // Concurrent Secondary: 10:00 - 11:30 Music
        { actId: 'act_music', startH: 10, startM: 0, endH: 11, endM: 30, role: 'SECONDARY' as const },
        // 13:00 - 14:00 : Lunch & Rest
        { actId: 'act_lunch', startH: 13, startM: 0, endH: 14, endM: 0, role: 'PRIMARY' as const },
        // Day -1 has a deliberate 45m unrecorded gap from 14:00 to 14:45 so user can test 'Review Gaps'!
        ...(dayOffset === 1
          ? [
              // Gap from 14:00 to 14:45
              { actId: 'act_coding', startH: 14, startM: 45, endH: 18, endM: 0, role: 'PRIMARY' as const },
            ]
          : [
              { actId: 'act_nap', startH: 14, startM: 0, endH: 14, endM: 45, role: 'PRIMARY' as const },
              { actId: 'act_coding', startH: 14, startM: 45, endH: 18, endM: 0, role: 'PRIMARY' as const },
            ]),
        // 18:00 - 19:15 : Evening Walk / Health
        { actId: 'act_walk', startH: 18, startM: 0, endH: 19, endM: 15, role: 'PRIMARY' as const },
        // 19:15 - 20:15 : Dinner & Family Time
        { actId: 'act_dinner', startH: 19, startM: 15, endH: 20, endM: 15, role: 'PRIMARY' as const },
        // 20:15 - 22:30 : Research & Reading
        { actId: 'act_research', startH: 20, startM: 15, endH: 22, endM: 30, role: 'PRIMARY' as const },
        // 22:30 - 24:00 : Night Sleep
        { actId: 'act_sleep', startH: 22, startM: 30, endH: 24, endM: 0, role: 'PRIMARY' as const },
      ];

      for (let i = 0; i < daySchedule.length; i++) {
        const item = daySchedule[i];
        const startTs = timeAt(item.startH, item.startM);
        const endTs = item.endH === 24 
          ? new Date(year, month, date + 1, 0, 0, 0, 0).getTime() 
          : timeAt(item.endH, item.endM);

        const occId = `mock_occ_d${dayOffset}_${i}_${startTs}`;
        const segId = `mock_seg_d${dayOffset}_${i}_${startTs}`;

        occurrences.push({
          id: occId,
          activityId: item.actId,
          kind: 'INTERVAL',
          source: 'RETROSPECTIVE',
          status: 'STOPPED',
          recordedAt: startTs + 60000,
          updatedAt: endTs,
          timeZone: 'Asia/Kolkata',
          utcOffsetMinutes: 330,
        });

        segments.push({
          id: segId,
          occurrenceId: occId,
          startAt: startTs,
          endAt: endTs,
          role: item.role,
          startConfidence: 'EXACT',
          endConfidence: 'EXACT',
        });
      }
    };

    // Seed Day -1 (Yesterday), Day -2 (2 days ago), Day -3 (3 days ago)
    createDaySchedule(1);
    createDaySchedule(2);
    createDaySchedule(3);

    await db.transaction('rw', [db.activityOccurrences, db.timeSegments], async () => {
      await db.activityOccurrences.bulkPut(occurrences);
      await db.timeSegments.bulkPut(segments);
    });

    return {
      addedCount: segments.length,
      message: `Seeded ${segments.length} segments across previous 3 days with full 11-category activities!`,
    };
  } catch (err) {
    console.error('Error seeding 3-day tracker mock data:', err);
    return { addedCount: 0, message: 'Failed to seed mock data' };
  }
}
