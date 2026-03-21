import { Component, computed, input, output, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TooltipModule } from 'primeng/tooltip';
import { doOptionsOverlap, VacationOption } from '../../../core/utils/vacation-optimizer';

@Component({
  selector: 'app-vacation-results',
  templateUrl: './vacation-results.html',
  styleUrl: './vacation-results.scss',
  imports: [TranslateModule, TooltipModule],
})
export class VacationResults {
  readonly results = input<VacationOption[]>([]);
  readonly selectedOptions = input<VacationOption[]>([]);
  readonly ptoBudget = input<number>(0);
  readonly totalPtoUsed = input<number>(0);
  readonly hasSearched = input(false);
  readonly midWeekFilteredCount = input(0);

  readonly optionToggle = output<VacationOption>();
  readonly autoOptimize = output<void>();
  readonly clearSelection = output<void>();
  readonly exportCalendar = output<void>();

  readonly sortMode = signal<'rest' | 'efficiency'>('rest');

  readonly sortedResults = computed(() => {
    const items = [...this.results()];
    if (this.sortMode() === 'rest') {
      items.sort((a, b) => b.totalRestDays - a.totalRestDays || b.efficiency - a.efficiency);
    } else {
      items.sort((a, b) => b.efficiency - a.efficiency || b.totalRestDays - a.totalRestDays);
    }
    return items;
  });

  readonly budgetPercent = computed(() => {
    const budget = this.ptoBudget();
    if (budget <= 0) return 0;
    return Math.min(100, Math.round((this.totalPtoUsed() / budget) * 100));
  });

  setSortMode(mode: 'rest' | 'efficiency'): void {
    this.sortMode.set(mode);
  }

  onCardClick(option: VacationOption): void {
    if (this.isDisabled(option)) return;
    this.optionToggle.emit(option);
  }

  formatDateRange(startDate: string, endDate: string): string {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${startStr} - ${endStr}`;
  }

  isSelected(option: VacationOption): boolean {
    return this.selectedOptions().some(
      o => o.startDate === option.startDate && o.endDate === option.endDate,
    );
  }

  isDisabled(option: VacationOption): boolean {
    if (this.isSelected(option)) return false;

    const selected = this.selectedOptions();
    const overlaps = selected.some(o => doOptionsOverlap(o, option));
    if (overlaps) return true;

    return this.totalPtoUsed() + option.ptoDaysUsed > this.ptoBudget();
  }
}
