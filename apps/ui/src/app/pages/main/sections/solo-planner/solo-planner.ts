import { Component, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Configuration } from '../../../components/configuration/configuration';
import { CalendarOverview } from '../../../components/calendar-overview/calendar-overview';
import { PublicHoliday } from '../../../components/configuration/configuration.model';

@Component({
  selector: 'app-solo-planner',
  imports: [TranslateModule, Configuration, CalendarOverview],
  templateUrl: './solo-planner.html',
  styleUrl: './solo-planner.scss',
})
export class SoloPlanner {
  readonly selectedYear = signal(new Date().getFullYear());
  readonly holidays = signal<PublicHoliday[]>([]);

  onYearChange(year: number): void {
    this.selectedYear.set(year);
  }

  onHolidaysChange(holidays: PublicHoliday[]): void {
    this.holidays.set(holidays);
  }
}
