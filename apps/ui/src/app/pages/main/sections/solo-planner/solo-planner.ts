import { Component, computed, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Configuration } from '../../../components/configuration/configuration';
import { CalendarOverview } from '../../../components/calendar-overview/calendar-overview';
import { VacationResults } from '../../../components/vacation-results/vacation-results';
import { PublicHoliday, VacationSearchParams } from '../../../components/configuration/configuration.model';
import {
  doOptionsOverlap,
  findOptimalCombination,
  findOptimalVacations,
  VacationOption,
} from '../../../../core/utils/vacation-optimizer';

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

  readonly totalPtoUsed = computed(() =>
    this.selectedOptions().reduce((sum, o) => sum + o.ptoDaysUsed, 0),
  );

  readonly allPtoDates = computed(() =>
    this.selectedOptions().flatMap(o => o.ptoDates),
  );

  onYearChange(year: number): void {
    this.selectedYear.set(year);
    this.vacationResults.set([]);
    this.selectedOptions.set([]);
    this.hasSearched.set(false);
  }

  onHolidaysChange(holidays: PublicHoliday[]): void {
    this.holidays.set(holidays);
    this.vacationResults.set([]);
    this.selectedOptions.set([]);
    this.hasSearched.set(false);
  }

  onSearch(params: VacationSearchParams): void {
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

    const overlaps = current.some(o => doOptionsOverlap(o, option));
    if (overlaps) return;

    if (this.totalPtoUsed() + option.ptoDaysUsed > this.ptoBudget()) return;

    this.selectedOptions.set([...current, option]);
  }

  onAutoOptimize(): void {
    const optimal = findOptimalCombination(this.vacationResults(), this.ptoBudget());
    this.selectedOptions.set(optimal);
  }

  onClearSelection(): void {
    this.selectedOptions.set([]);
  }
}
