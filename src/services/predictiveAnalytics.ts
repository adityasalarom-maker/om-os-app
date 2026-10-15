import { db, type GoalItem, type TaskItem, type HealthEntry, type JournalEntry } from '../db';

export type LifeAreaKey = 
  | 'Spiritual & Inner' 
  | 'Health & Vitality' 
  | 'Wealth & Assets' 
  | 'Career & Skills' 
  | 'Family & Relationships';

export interface LifeAreaScore {
  area: LifeAreaKey;
  score: number; // 0 - 100
  targetScore: number; // default 80
  goalsCount: number;
  avgGoalProgress: number;
  tasksCompleted: number;
  healthRating?: number;
  journalRating?: number;
  statusText: string;
}

export interface LifeEquilibriumReport {
  scores: LifeAreaScore[];
  equilibriumIndex: number; // 0 - 100
  variance: number;
  status: 'Harmonious' | 'Balanced' | 'Moderate Imbalance' | 'Severe Imbalance';
  strongestArea: LifeAreaKey;
  weakestArea: LifeAreaKey;
  recommendations: string[];
}

export interface HabitHeatmapDay {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0 = Sun, 1 = Mon ...
  score: number; // 0 - 100
  level: 0 | 1 | 2 | 3 | 4;
  rituals: {
    intentionsDone: boolean;
    pranayamaDone: boolean;
    deepWorkDone: boolean;
    journalLogged: boolean;
    pranaRating: number;
  };
}

export interface HabitConsistencyStats {
  days: HabitHeatmapDay[];
  currentStreak: number;
  bestStreak: number;
  consistencyRate: number; // % of days with level >= 2
  totalActiveDays: number;
}

export interface FinancialRunwaySettings {
  liquidReserves: number; // INR ₹
  monthlyBurn: number; // INR ₹
  monthlyInflow: number; // INR ₹
  landTargetBudget: number; // INR ₹
}

export interface RunwayProjectionPoint {
  monthIndex: number;
  label: string; // e.g. "Oct '26"
  baselineReserves: number;
  asceticReserves: number;
  landAcquisitionReserves: number;
}

export interface FinancialReport {
  settings: FinancialRunwaySettings;
  netCashflow: number;
  runwayMonths: number;
  landSavingsProgress: number;
  projections: RunwayProjectionPoint[];
  solvencyRating: 'Optimal (>24 Mo)' | 'Healthy (12-24 Mo)' | 'Guarded (6-12 Mo)' | 'Vulnerable (<6 Mo)';
}

export const CANONICAL_LIFE_AREAS: LifeAreaKey[] = [
  'Spiritual & Inner',
  'Health & Vitality',
  'Wealth & Assets',
  'Career & Skills',
  'Family & Relationships'
];

/**
 * Computes 5-Spoke Life Balance Radar & Equilibrium Index from Dexie stores
 */
export function calculateLifeEquilibrium(
  goals: GoalItem[],
  tasks: TaskItem[],
  healthEntries: HealthEntry[],
  journalEntries: JournalEntry[]
): LifeEquilibriumReport {
  const scores: LifeAreaScore[] = CANONICAL_LIFE_AREAS.map(area => {
    const areaGoals = goals.filter(g => g.lifeArea === area);
    const avgGoalProgress = areaGoals.length > 0 
      ? Math.round(areaGoals.reduce((acc, g) => acc + (g.progress || 0), 0) / areaGoals.length)
      : 30; // baseline if no goals set yet

    // Derive task activity matching area keywords
    const areaKeywords = area.toLowerCase().split(/[ &]+/);
    const areaTasks = tasks.filter(t => 
      areaKeywords.some(kw => t.title.toLowerCase().includes(kw))
    );
    const tasksCompleted = areaTasks.filter(t => t.isCompleted).length;

    let score = avgGoalProgress;
    let statusText = 'Steady progress';

    if (area === 'Spiritual & Inner') {
      // Factor journal mood & clarity scores
      const recentJournals = journalEntries.slice(0, 7);
      const avgClarity = recentJournals.length > 0
        ? recentJournals.reduce((acc, j) => acc + (j.clarityScore || j.moodScore || 7), 0) / recentJournals.length
        : 7.5;
      score = Math.round((avgGoalProgress * 0.6) + (avgClarity * 10 * 0.4));
      statusText = score >= 75 ? 'Dhyana & Sattva active' : 'Needs daily meditation focus';
    } else if (area === 'Health & Vitality') {
      // Factor health pranaScore and sleep
      const recentHealth = healthEntries.slice(0, 7);
      const avgPrana = recentHealth.length > 0
        ? recentHealth.reduce((acc, h) => acc + (h.pranaScore || 7), 0) / recentHealth.length
        : 8;
      score = Math.round((avgGoalProgress * 0.5) + (avgPrana * 10 * 0.5));
      statusText = score >= 70 ? 'High Prana & Dinacharya' : 'Optimize sleep & herbal intake';
    } else if (area === 'Wealth & Assets') {
      score = Math.min(100, Math.round(avgGoalProgress * 0.8 + (tasksCompleted > 0 ? 20 : 10)));
      statusText = score >= 60 ? 'Land diligence on track' : 'Accelerate Himalayan site surveys';
    } else if (area === 'Career & Skills') {
      const q1q2Done = tasks.filter(t => (t.quadrant === 'Q1' || t.quadrant === 'Q2') && t.isCompleted).length;
      score = Math.min(100, Math.round(avgGoalProgress * 0.7 + q1q2Done * 6));
      statusText = score >= 70 ? 'Deep work rhythm solid' : 'Increase Q2 strategic execution';
    } else if (area === 'Family & Relationships') {
      score = areaGoals.length > 0 ? avgGoalProgress : 65;
      statusText = score >= 65 ? 'Harmonious domestic rhythm' : 'Schedule family presence';
    }

    // Clamp score
    score = Math.max(15, Math.min(100, score));

    return {
      area,
      score,
      targetScore: 80,
      goalsCount: areaGoals.length,
      avgGoalProgress,
      tasksCompleted,
      statusText
    };
  });

  // Calculate Equilibrium Index (Mean penalized by standard deviation)
  const mean = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
  const variance = Math.sqrt(
    scores.reduce((sum, s) => sum + Math.pow(s.score - mean, 2), 0) / scores.length
  );
  
  // High variance means life is heavily skewed in one area at the cost of others
  const equilibriumIndex = Math.max(10, Math.round(mean - (variance * 0.35)));

  let status: LifeEquilibriumReport['status'] = 'Balanced';
  if (variance < 10 && mean >= 70) status = 'Harmonious';
  else if (variance > 25) status = 'Severe Imbalance';
  else if (variance > 18) status = 'Moderate Imbalance';

  // Identify extremes
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const strongestArea = sorted[0].area;
  const weakestArea = sorted[sorted.length - 1].area;

  // Generate actionable recommendations
  const recommendations: string[] = [];
  if (variance > 15) {
    recommendations.push(`Significant energy divergence detected: ${strongestArea} (${sorted[0].score}%) is outpacing ${weakestArea} (${sorted[sorted.length - 1].score}%).`);
  }
  if (sorted[sorted.length - 1].score < 50) {
    recommendations.push(`Priority rebalancing: Dedicate your next Q2 strategic block to "${weakestArea}".`);
  }
  recommendations.push(`Overall Life Equilibrium Index: ${equilibriumIndex}/100. ${status}.`);

  return {
    scores,
    equilibriumIndex,
    variance: Math.round(variance),
    status,
    strongestArea,
    weakestArea,
    recommendations
  };
}

/**
 * Generates 30-day multi-ritual contribution matrix & habit streaks
 */
export function generate30DayHabitHeatmap(
  journalEntries: JournalEntry[],
  healthEntries: HealthEntry[],
  tasks: TaskItem[],
  daysCount: number = 35
): HabitConsistencyStats {
  const now = new Date();
  const days: HabitHeatmapDay[] = [];
  const journalMap = new Map<string, JournalEntry>();
  const healthMap = new Map<string, HealthEntry>();

  for (const j of journalEntries) {
    journalMap.set(j.date, j);
  }
  for (const h of healthEntries) {
    healthMap.set(h.date, h);
  }

  // Generate past N days ending today
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayOfWeek = d.getDay(); // 0 is Sunday

    const jEntry = journalMap.get(dateStr);
    const hEntry = healthMap.get(dateStr);

    const intentionsDone = Boolean(
      jEntry && (jEntry.morningCompleted?.some(c => c) || jEntry.morningTop3.length > 0)
    );
    const pranayamaDone = Boolean(
      hEntry && (hEntry.yogaPranayamaMin > 0 || hEntry.pranaScore >= 7)
    );
    const journalLogged = Boolean(
      jEntry && (jEntry.content.length > 20 || (jEntry.eveningWins && jEntry.eveningWins.length > 0))
    );
    const pranaRating = hEntry?.pranaScore || jEntry?.energyScore || (i === 0 ? 8 : 7);
    const deepWorkDone = Boolean(
      (jEntry && jEntry.morningTop3.length >= 2) || (hEntry && hEntry.dietType === 'Sattvic')
    );

    // Calculate daily completion score (0 - 100)
    let score = 0;
    if (intentionsDone) score += 25;
    if (pranayamaDone) score += 25;
    if (journalLogged) score += 20;
    if (deepWorkDone) score += 20;
    if (pranaRating >= 8) score += 10;

    let level: HabitHeatmapDay['level'] = 0;
    if (score >= 80) level = 4;
    else if (score >= 60) level = 3;
    else if (score >= 40) level = 2;
    else if (score >= 20) level = 1;

    days.push({
      date: dateStr,
      dayOfWeek,
      score,
      level,
      rituals: {
        intentionsDone,
        pranayamaDone,
        deepWorkDone,
        journalLogged,
        pranaRating
      }
    });
  }

  // Calculate streaks
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;

  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].level >= 2) {
      currentStreak++;
    } else {
      break;
    }
  }

  for (const day of days) {
    if (day.level >= 2) {
      tempStreak++;
      if (tempStreak > bestStreak) bestStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }

  const activeDaysCount = days.filter(d => d.level >= 2).length;
  const consistencyRate = Math.round((activeDaysCount / days.length) * 100);

  return {
    days,
    currentStreak,
    bestStreak,
    consistencyRate,
    totalActiveDays: activeDaysCount
  };
}

/**
 * Calculates predictive financial burn & 24-month runway projections
 */
export function calculateFinancialRunway(
  settings: FinancialRunwaySettings
): FinancialReport {
  const { liquidReserves, monthlyBurn, monthlyInflow, landTargetBudget } = settings;
  const netCashflow = monthlyInflow - monthlyBurn;
  
  // Runway calculation (if net burning, how many months until reserves hit zero)
  let runwayMonths = 99;
  if (monthlyBurn > monthlyInflow) {
    const netDeficit = monthlyBurn - monthlyInflow;
    runwayMonths = Math.round((liquidReserves / netDeficit) * 10) / 10;
  }

  let solvencyRating: FinancialReport['solvencyRating'] = 'Optimal (>24 Mo)';
  if (runwayMonths < 6) solvencyRating = 'Vulnerable (<6 Mo)';
  else if (runwayMonths < 12) solvencyRating = 'Guarded (6-12 Mo)';
  else if (runwayMonths < 24) solvencyRating = 'Healthy (12-24 Mo)';

  const landSavingsProgress = Math.min(100, Math.round((liquidReserves / landTargetBudget) * 100));

  // 24-month projection points
  const projections: RunwayProjectionPoint[] = [];
  const now = new Date();

  let curBaseline = liquidReserves;
  let curAscetic = liquidReserves;
  let curLandAcq = liquidReserves;

  // Minimalist / Ascetic burn is 25% lower expenses
  const asceticBurn = monthlyBurn * 0.75;
  const asceticNet = monthlyInflow - asceticBurn;

  // Land acquisition scenario assumes down-payment of ₹8,00,000 at month 6
  const landDownPayment = Math.min(liquidReserves * 0.5, 800000);

  for (let m = 0; m <= 24; m += 2) {
    const d = new Date(now);
    d.setMonth(d.getMonth() + m);
    const monthName = d.toLocaleString('default', { month: 'short' });
    const yearShort = d.getFullYear().toString().slice(-2);
    const label = `${monthName} '${yearShort}`;

    if (m > 0) {
      curBaseline += (netCashflow * 2);
      curAscetic += (asceticNet * 2);
      curLandAcq += (netCashflow * 2);
      if (m === 6) curLandAcq -= landDownPayment;
    }

    projections.push({
      monthIndex: m,
      label,
      baselineReserves: Math.max(0, Math.round(curBaseline)),
      asceticReserves: Math.max(0, Math.round(curAscetic)),
      landAcquisitionReserves: Math.max(0, Math.round(curLandAcq))
    });
  }

  return {
    settings,
    netCashflow,
    runwayMonths,
    landSavingsProgress,
    projections,
    solvencyRating
  };
}

/**
 * Seeds realistic 30-day historical data if the user's database is new/sparse
 */
export async function seedDemoAnalyticsDataIfSparse(): Promise<{ addedJournal: number; addedHealth: number }> {
  const journalCount = await db.journal.count();
  if (journalCount >= 10) return { addedJournal: 0, addedHealth: 0 };

  const now = new Date();
  let addedJournal = 0;
  let addedHealth = 0;

  for (let i = 1; i <= 30; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const timestamp = d.getTime();

    // Check if entry already exists
    const existingJ = await db.journal.where('date').equals(dateStr).first();
    if (!existingJ) {
      const mood = 7 + Math.floor(Math.sin(i * 0.4) * 2 + 1);
      const energy = 8 + Math.floor(Math.cos(i * 0.3) * 2);
      const isCompleteDay = i % 4 !== 0;

      await db.journal.add({
        id: `journal-${dateStr}`,
        date: dateStr,
        entryType: 'Daily',
        moodScore: Math.min(10, Math.max(5, mood)),
        energyScore: Math.min(10, Math.max(6, energy)),
        clarityScore: Math.min(10, Math.max(6, mood)),
        morningTop3: [
          'Dhyana & pranayama practice',
          'Om Knowledge OS architecture sprint',
          'Review land diligence parameters'
        ],
        morningCompleted: isCompleteDay ? [true, true, true] : [true, true, false],
        eveningWins: [
          'Sustained high clarity without digital distraction',
          'Deep work session on local-first database'
        ],
        gratitude: ['Peaceful morning hours', 'Clarity of purpose'],
        content: `Day ${i} retrospective: Kept Sattvic focus throughout the afternoon. Pranic momentum continues steady.`,
        createdAt: timestamp,
        updatedAt: timestamp
      });
      addedJournal++;
    }

    const existingH = await db.health.where('date').equals(dateStr).first();
    if (!existingH) {
      const prana = 7 + (i % 3);
      await db.health.add({
        id: `health-${dateStr}`,
        date: dateStr,
        sleepHours: 7.5 + (i % 2 === 0 ? 0.5 : -0.5),
        sleepQuality: i % 5 === 0 ? 'Moderate' : 'Deep / Restful',
        digestionAgni: 'Sama (Balanced)',
        doshaState: {
          vata: 'Balanced',
          pitta: 'Balanced',
          kapha: 'Balanced'
        },
        pranaScore: Math.min(10, prana),
        yogaPranayamaMin: 35 + (i % 4) * 10,
        dietType: 'Sattvic',
        herbsTaken: ['Triphala', 'A2 Ghee', 'Ashwagandha'],
        symptomsOrNotes: 'High mental clarity, steady digestion.',
        createdAt: timestamp,
        updatedAt: timestamp
      });
      addedHealth++;
    }
  }

  return { addedJournal, addedHealth };
}
