/**
 * TDP (Ten Day Period) fiscal calendar.
 *
 * Source of truth is the business-provided table:
 *   Book Month | TenDayPeriodNumber | MonthlyOperatingCycleNumber (MOC)
 *   Dec        | 202601             | 202601
 *   Jan        | 202602             | 202601
 *   Jan        | 202603             | 202601
 *   Jan        | 202604             | 202602
 *   ...
 *   Dec        | 202636             | 202612
 *   Jan        | 202701             | 202701
 *
 * Rules encoded from that table:
 * - An MOC runs the 21st of one month through the 20th of the next, named for
 *   the month it ends in (MOC 202608 ends 20-Aug-2026).
 * - Each MOC splits into exactly 3 TDPs: day 21–end of the start month, day
 *   1–10 of the end month, day 11–20 of the end month.
 * - The TDP number runs 01–36 across the fiscal year (it does not reset each
 *   MOC) — TDP number = (MOC number − 1) × 3 + sub-period(1|2|3).
 * - The TDP code is fiscalYear + 2-digit number, e.g. 202622; fiscalYear is
 *   the MOC's ending year, matching the table above.
 */

export interface TdpPeriod {
  tdp: string;   // e.g. "202622"
  moc: string;   // e.g. "202608"
  start: Date;   // inclusive
  end: Date;     // inclusive
}

function lastDayOfMonth(year: number, month0: number): number {
  return new Date(year, month0 + 1, 0).getDate();
}

/** Builds every TDP period for MOCs ending in the given calendar years (inclusive). */
function buildTdpCalendar(fromYear: number, toYear: number): TdpPeriod[] {
  const periods: TdpPeriod[] = [];

  for (let endYear = fromYear; endYear <= toYear; endYear++) {
    for (let mocNumber = 1; mocNumber <= 12; mocNumber++) {
      const endMonth0 = mocNumber - 1;
      const startMonth0 = endMonth0 === 0 ? 11 : endMonth0 - 1;
      const startYear = endMonth0 === 0 ? endYear - 1 : endYear;
      const mocCode = `${endYear}${String(mocNumber).padStart(2, "0")}`;

      const subPeriods: [number, number][] = [
        [21, lastDayOfMonth(startYear, startMonth0)],
        [1, 10],
        [11, 20],
      ];

      subPeriods.forEach(([fromDay, toDay], i) => {
        const isStartMonthPeriod = i === 0;
        const year = isStartMonthPeriod ? startYear : endYear;
        const month0 = isStartMonthPeriod ? startMonth0 : endMonth0;
        const tdpNumber = (mocNumber - 1) * 3 + (i + 1);
        periods.push({
          tdp: `${endYear}${String(tdpNumber).padStart(2, "0")}`,
          moc: mocCode,
          start: new Date(year, month0, fromDay),
          end: new Date(year, month0, toDay),
        });
      });
    }
  }

  return periods.sort((a, b) => a.start.getTime() - b.start.getTime());
}

// Wide enough window around "today" to cover any realistic dataset/date without
// regenerating on every render; extend the range here if data ever falls outside it.
export const TDP_CALENDAR: TdpPeriod[] = buildTdpCalendar(2024, 2030);

export function tdpPeriodForDate(date: Date): TdpPeriod {
  const time = date.getTime();
  const found = TDP_CALENDAR.find(p => time >= p.start.getTime() && time <= p.end.getTime());
  if (found) return found;
  // Fallback: clamp to nearest known period if date falls outside the generated window.
  return time < TDP_CALENDAR[0].start.getTime()
    ? TDP_CALENDAR[0]
    : TDP_CALENDAR[TDP_CALENDAR.length - 1];
}

export function tdpCodeForDate(date: Date): string {
  return tdpPeriodForDate(date).tdp;
}
