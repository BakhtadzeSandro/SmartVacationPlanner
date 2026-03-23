import { Component, computed, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Configuration } from '../../../components/configuration/configuration';
import { CalendarOverview } from '../../../components/calendar-overview/calendar-overview';
import { VacationResults } from '../../../components/vacation-results/vacation-results';
import { PublicHoliday, VacationSearchParams } from '../../../components/configuration/configuration.model';
import {
  areOptionsCompatible,
  doOptionsOverlap,
  findOptimalCombination,
  findOptimalVacations,
  VacationOption,
} from '../../../../core/utils/vacation-optimizer';
import { downloadIcs, generateIcs } from '../../../../core/utils/ics-export';

@Component({
  selector: 'app-solo-planner',
  imports: [TranslateModule, Configuration, CalendarOverview, VacationResults],
  templateUrl: './solo-planner.html',
  styleUrl: './solo-planner.scss',
})
export class SoloPlanner {
  readonly selectedYear = signal(new Date().getFullYear());
  readonly holidays = signal<PublicHoliday[]>([]);
  readonly vacationResults = signal<VacationOption[]>([]);
  readonly selectedOptions = signal<VacationOption[]>([]);
  readonly ptoBudget = signal<number>(0);
  readonly hasSearched = signal(false);
  readonly midWeekFilteredCount = signal(0);
  readonly allHolidaysOnWeekends = signal(false);

  private lastSearchParams: VacationSearchParams | null = null;

  readonly totalPtoUsed = computed(() =>
    this.selectedOptions().reduce((sum, o) => sum + o.ptoDaysUsed, 0),
  );

  readonly allPtoDates = computed(() =>
    this.selectedOptions().flatMap(o => o.ptoDates),
  );

  onYearChange(year: number): void {
    this.selectedYear.set(year);
    this.selectedOptions.set([]);
    this.vacationResults.set([]);
  }

  onHolidaysChange(holidays: PublicHoliday[]): void {
    this.holidays.set(holidays);
    this.selectedOptions.set([]);

    if (this.hasSearched() && this.lastSearchParams) {
      this.runSearch({ ...this.lastSearchParams, year: this.selectedYear() });
    }
  }

  onSearch(params: VacationSearchParams): void {
    this.lastSearchParams = params;
    this.runSearch(params);
  }

  private runSearch(params: VacationSearchParams): void {
    const results = findOptimalVacations(
      params.year,
      this.holidays(),
      params.maxPtoDays,
      params.periodFilter,
    );
    let filtered = results.filter(r => r.ptoDaysUsed >= params.minPtoDays);

    if (!params.enableMidWeekStarts) {
      const beforeCount = filtered.length;
      filtered = filtered.filter(r => {
        const dow = new Date(r.startDate + 'T00:00:00').getDay();
        return dow === 0 || dow === 5 || dow === 6;
      });
      this.midWeekFilteredCount.set(beforeCount - filtered.length);
    } else {
      this.midWeekFilteredCount.set(0);
    }

    this.vacationResults.set(filtered);
    this.selectedOptions.set([]);
    this.ptoBudget.set(params.ptoDays);
    this.hasSearched.set(true);

    if (filtered.length === 0) {
      const holidays = this.holidays();
      const periodHolidays = holidays.filter((h) => {
        const d = new Date(h.date + 'T00:00:00');
        const month = d.getMonth();
        return !params.periodFilter || params.periodFilter === 'all-year' || this.getMonthsForPeriod(params.periodFilter).includes(month);
      });
      const hasHolidays = periodHolidays.length > 0;
      const allOnWeekends = hasHolidays && periodHolidays.every((h) => {
        const dow = new Date(h.date + 'T00:00:00').getDay();
        return dow === 0 || dow === 6;
      });
      this.allHolidaysOnWeekends.set(allOnWeekends);
    } else {
      this.allHolidaysOnWeekends.set(false);
    }
  }

  onToggleOption(option: VacationOption): void {
    const current = this.selectedOptions();
    const idx = current.findIndex(
      o => o.startDate === option.startDate && o.endDate === option.endDate,
    );

    if (idx >= 0) {
      this.selectedOptions.set(current.filter((_, i) => i !== idx));
      return;
    }

    const minGapDays = this.lastSearchParams?.minGapDays ?? 0;
    const incompatible = current.some(o => !areOptionsCompatible(o, option, minGapDays));
    if (incompatible) return;

    if (this.totalPtoUsed() + option.ptoDaysUsed > this.ptoBudget()) return;

    this.selectedOptions.set([...current, option]);
  }

  onAutoOptimize(): void {
    const minGapDays = this.lastSearchParams?.minGapDays ?? 0;
    const optimal = findOptimalCombination(this.vacationResults(), this.ptoBudget(), minGapDays);
    this.selectedOptions.set(optimal);
  }

  onClearSelection(): void {
    this.selectedOptions.set([]);
  }

  onExportCalendar(): void {
    downloadIcs(generateIcs(this.selectedOptions()));
  }

  private getMonthsForPeriod(period: string): number[] {
    const map: Record<string, number[]> = {
      'all-year': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      spring: [2, 3, 4], summer: [5, 6, 7], fall: [8, 9, 10], winter: [11, 0, 1],
      January: [0], February: [1], March: [2], April: [3], May: [4], June: [5],
      July: [6], August: [7], September: [8], October: [9], November: [10], December: [11],
    };
    return map[period] ?? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  }
}
