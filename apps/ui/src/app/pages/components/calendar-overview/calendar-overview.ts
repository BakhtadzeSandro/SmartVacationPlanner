import { Component, computed, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TooltipModule } from 'primeng/tooltip';
import { PublicHoliday } from '../configuration/configuration.model';

export type DayHighlightType = 'weekend' | 'public-holiday' | 'pto';

export interface CalendarDay {
  day: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  highlightType: DayHighlightType | null;
  holidayTooltip: string;
}

export interface CalendarMonth {
  nameKey: string;
  year: number;
  month: number;
  weeks: CalendarDay[][];
}

@Component({
  selector: 'app-calendar-overview',
  templateUrl: './calendar-overview.html',
  styleUrl: './calendar-overview.scss',
  imports: [TranslateModule, TooltipModule],
})
export class CalendarOverview {
  readonly selectedYear = input(new Date().getFullYear());
  readonly holidays = input<PublicHoliday[]>([]);
  readonly highlightedPtoDates = input<string[]>([]);

  private readonly ptoDatesSet = computed(() => new Set(this.highlightedPtoDates()));

  private readonly holidayMap = computed(() => {
    const map = new Map<string, PublicHoliday>();
    for (const h of this.holidays()) {
      map.set(h.date, h);
    }
    return map;
  });

  private readonly holidayTooltipMap = computed(() => {
    const map = new Map<string, string>();
    for (const [date, holiday] of this.holidayMap()) {
      map.set(date, holiday.name);
    }
    return map;
  });

  readonly dayHeaderKeys = [
    'SoloPlanner.DayHeader.Mon',
    'SoloPlanner.DayHeader.Tue',
    'SoloPlanner.DayHeader.Wed',
    'SoloPlanner.DayHeader.Thu',
    'SoloPlanner.DayHeader.Fri',
    'SoloPlanner.DayHeader.Sat',
    'SoloPlanner.DayHeader.Sun',
  ];

  readonly calendarMonths = computed(() => {
    const year = this.selectedYear();
    const ptoDates = this.ptoDatesSet();
    const holidayDates = this.holidayMap();
    const tooltips = this.holidayTooltipMap();
    return Array.from({ length: 12 }, (_, i) =>
      this.buildMonth(year, i, ptoDates, holidayDates, tooltips),
    );
  });

  private formatDateStr(year: number, month: number, day: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  private getHighlightType(
    year: number,
    month: number,
    day: number,
    ptoDates: Set<string>,
    holidayDates: Map<string, PublicHoliday>,
  ): DayHighlightType | null {
    const dateStr = this.formatDateStr(year, month, day);

    if (ptoDates.has(dateStr)) return 'pto';

    if (holidayDates.has(dateStr)) return 'public-holiday';

    const d = new Date(year, month, day);
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return 'weekend';

    return null;
  }

  private buildMonth(
    year: number,
    month: number,
    ptoDates: Set<string>,
    holidayDates: Map<string, PublicHoliday>,
    tooltips: Map<string, string>,
  ): CalendarMonth {
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Monday-first: Mon=0 … Sun=6
    const startDow = (firstDay.getDay() + 6) % 7;

    const days: CalendarDay[] = [];

    // Previous month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      days.push({
        day: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear(),
        isCurrentMonth: false,
        highlightType: null,
        holidayTooltip: '',
      });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = this.formatDateStr(year, month, d);
      days.push({
        day: d,
        month,
        year,
        isCurrentMonth: true,
        highlightType: this.getHighlightType(year, month, d, ptoDates, holidayDates),
        holidayTooltip: tooltips.get(dateStr) ?? '',
      });
    }

    // Next month padding
    while (days.length % 7 !== 0) {
      const nextDay = days.length - startDow - daysInMonth + 1;
      const d = new Date(year, month + 1, nextDay);
      days.push({
        day: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear(),
        isCurrentMonth: false,
        highlightType: null,
        holidayTooltip: '',
      });
    }

    // Split into weeks
    const weeks: CalendarDay[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const nameKey = `SoloPlanner.Month.${monthNames[month]}`;

    return { nameKey, year, month, weeks };
  }
}
