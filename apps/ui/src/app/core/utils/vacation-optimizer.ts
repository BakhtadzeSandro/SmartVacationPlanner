import { PublicHoliday } from '../../pages/components/configuration/configuration.model';

export interface VacationOption {
  startDate: string;
  endDate: string;
  totalDaysOff: number;
  totalRestDays: number;
  ptoDaysUsed: number;
  efficiency: number;
  ptoDates: string[];
  holidaysIncluded: { date: string; name: string }[];
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}

function isWeekday(d: Date): boolean {
  const dow = d.getDay();
  return dow !== 0 && dow !== 6;
}

function getMonthsForPeriod(periodFilter: string): number[] | null {
  switch (periodFilter) {
    case 'all-year':
      return null;
    case 'spring':
      return [2, 3, 4];
    case 'summer':
      return [5, 6, 7];
    case 'fall':
      return [8, 9, 10];
    case 'winter':
      return [11, 0, 1];
    case 'January':
      return [0];
    case 'February':
      return [1];
    case 'March':
      return [2];
    case 'April':
      return [3];
    case 'May':
      return [4];
    case 'June':
      return [5];
    case 'July':
      return [6];
    case 'August':
      return [7];
    case 'September':
      return [8];
    case 'October':
      return [9];
    case 'November':
      return [10];
    case 'December':
      return [11];
    default:
      return null;
  }
}

interface Cluster {
  start: Date;
  end: Date;
}

interface Gap {
  start: Date;
  end: Date;
  days: number;
}

export function findOptimalVacations(
  year: number,
  holidays: PublicHoliday[],
  ptoDays: number,
  periodFilter: string,
): VacationOption[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = formatDate(today);

  const holidaySet = new Set<string>();
  const holidayNameMap = new Map<string, string>();
  for (const h of holidays) {
    holidaySet.add(h.date);
    holidayNameMap.set(h.date, h.name);
  }

  // Build free-day set for the year
  const freeDays = new Set<string>();
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31);

  for (let d = new Date(startOfYear); d <= endOfYear; d = addDays(d, 1)) {
    const dow = d.getDay();
    const dateStr = formatDate(d);
    if (dow === 0 || dow === 6 || holidaySet.has(dateStr)) {
      freeDays.add(dateStr);
    }
  }

  // Find clusters: maximal consecutive runs of free days
  const clusters: Cluster[] = [];
  let d = new Date(startOfYear);
  while (d <= endOfYear) {
    const dateStr = formatDate(d);
    if (freeDays.has(dateStr)) {
      const clusterStart = new Date(d);
      while (d <= endOfYear && freeDays.has(formatDate(d))) {
        d = addDays(d, 1);
      }
      const clusterEnd = addDays(d, -1);
      clusters.push({ start: clusterStart, end: clusterEnd });
    } else {
      d = addDays(d, 1);
    }
  }

  if (clusters.length < 2) {
    return [];
  }

  // Find gaps between adjacent clusters
  const gaps: Gap[] = [];
  for (let i = 0; i < clusters.length - 1; i++) {
    const gapStart = addDays(clusters[i].end, 1);
    const gapEnd = addDays(clusters[i + 1].start, -1);
    const gapDays = Math.round((gapEnd.getTime() - gapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    gaps.push({ start: gapStart, end: gapEnd, days: gapDays });
  }

  // Sliding window: for each starting cluster i, try bridging consecutive gaps
  const results: VacationOption[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < gaps.length; i++) {
    let ptoUsed = 0;

    for (let j = i; j < gaps.length; j++) {
      ptoUsed += gaps[j].days;
      if (ptoUsed > ptoDays) break;

      // The vacation spans from cluster[i].start to cluster[j+1].end
      const vacStart = clusters[i].start;
      const vacEnd = clusters[j + 1].end;
      const vacStartStr = formatDate(vacStart);
      const vacEndStr = formatDate(vacEnd);

      // Skip past vacations
      if (vacStartStr < todayStr) continue;

      const totalRestDays =
        Math.round((vacEnd.getTime() - vacStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // Collect PTO dates
      const ptoDates: string[] = [];
      for (let g = i; g <= j; g++) {
        for (let dd = new Date(gaps[g].start); dd <= gaps[g].end; dd = addDays(dd, 1)) {
          ptoDates.push(formatDate(dd));
        }
      }

      // Collect only weekday holidays (weekend holidays don't save PTO)
      const holidaysIncluded: { date: string; name: string }[] = [];
      for (let dd = new Date(vacStart); dd <= vacEnd; dd = addDays(dd, 1)) {
        const ds = formatDate(dd);
        if (holidaySet.has(ds) && isWeekday(dd)) {
          holidaysIncluded.push({ date: ds, name: holidayNameMap.get(ds) ?? '' });
        }
      }
      const weekdayHolidays = holidaysIncluded.length;

      // totalDaysOff = working weekdays off only (PTO + weekday holidays)
      const totalDaysOff = ptoUsed + weekdayHolidays;

      const key = `${vacStartStr}_${vacEndStr}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          startDate: vacStartStr,
          endDate: vacEndStr,
          totalDaysOff,
          totalRestDays,
          ptoDaysUsed: ptoUsed,
          efficiency: Math.round((totalRestDays / ptoUsed) * 10) / 10,
          ptoDates,
          holidaysIncluded,
        });
      }
    }
  }

  // Remove results that don't include any public holidays
  const withHolidays = results.filter((r) => r.holidaysIncluded.length > 0);

  // Filter by period
  const allowedMonths = getMonthsForPeriod(periodFilter);
  let filtered = withHolidays;
  if (allowedMonths) {
    filtered = withHolidays.filter((r) => {
      const startMonth = new Date(r.startDate + 'T00:00:00').getMonth();
      return allowedMonths.includes(startMonth);
    });
  }

  return filtered.slice(0, 50);
}

export function doOptionsOverlap(a: VacationOption, b: VacationOption): boolean {
  return a.startDate <= b.endDate && b.startDate <= a.endDate;
}

export function findOptimalCombination(
  bridges: VacationOption[],
  ptoBudget: number,
): VacationOption[] {
  if (bridges.length === 0 || ptoBudget <= 0) return [];

  const n = bridges.length;
  const sorted = [...bridges].sort((a, b) => a.endDate.localeCompare(b.endDate));

  // For each bridge i, find the latest non-overlapping predecessor
  const compat = new Array<number>(n).fill(-1);
  for (let i = 0; i < n; i++) {
    for (let j = i - 1; j >= 0; j--) {
      if (!doOptionsOverlap(sorted[j], sorted[i])) {
        compat[i] = j;
        break;
      }
    }
  }

  // dp[i][w] = max total rest days using bridges 0..i-1 with w PTO budget
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(ptoBudget + 1).fill(0),
  );

  for (let i = 1; i <= n; i++) {
    const bridge = sorted[i - 1];
    const cost = bridge.ptoDaysUsed;
    const value = bridge.totalRestDays;
    const prev = compat[i - 1]; // index in sorted, -1 means no predecessor

    for (let w = 0; w <= ptoBudget; w++) {
      // Skip bridge i
      dp[i][w] = dp[i - 1][w];

      // Take bridge i (if affordable)
      if (cost <= w) {
        const prevValue = prev >= 0 ? dp[prev + 1][w - cost] : 0;
        dp[i][w] = Math.max(dp[i][w], value + prevValue);
      }
    }
  }

  // Backtrack to find selected bridges
  const selected: VacationOption[] = [];
  let w = ptoBudget;
  for (let i = n; i >= 1; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      const bridge = sorted[i - 1];
      selected.push(bridge);
      w -= bridge.ptoDaysUsed;
      // Jump to compatible predecessor
      const prev = compat[i - 1];
      // Skip to prev + 1 (1-indexed)
      i = prev + 1 + 1; // +1 because loop does i--
    }
  }

  return selected;
}
