import { Component, computed, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

export type DayHighlightType = 'weekend' | 'public-holiday' | 'pto';

export interface CalendarDay {
  day: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
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
  imports: [TranslateModule],
})
export class CalendarOverview {
  readonly selectedYear = input(new Date().getFullYear());
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
    return Array.from({ length: 12 }, (_, i) => this.buildMonth(year, i));
  });

  getDayHighlightType(date: { year: number; month: number; day: number }): DayHighlightType | null {
    const d = new Date(date.year, date.month, date.day);
    const dayOfWeek = d.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 'weekend';
    }

    return null;
  }

  private buildMonth(year: number, month: number): CalendarMonth {
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Monday-first: Mon=0 … Sun=6
    const startDow = (firstDay.getDay() + 6) % 7;

    const days: CalendarDay[] = [];

    // Previous month padding (empty placeholders)
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      days.push({ day: d.getDate(), month: d.getMonth(), year: d.getFullYear(), isCurrentMonth: false });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ day: d, month, year, isCurrentMonth: true });
    }

    // Next month padding
    while (days.length % 7 !== 0) {
      const nextDay = days.length - startDow - daysInMonth + 1;
      const d = new Date(year, month + 1, nextDay);
      days.push({ day: d.getDate(), month: d.getMonth(), year: d.getFullYear(), isCurrentMonth: false });
    }

    // Split into weeks
    const weeks: CalendarDay[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const nameKey = `SoloPlanner.Period.${monthNames[month]}`;

    return { nameKey, year, month, weeks };
  }
}
