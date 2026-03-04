import { Component, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Configuration } from '../../../components/configuration/configuration';
import { CalendarOverview } from '../../../components/calendar-overview/calendar-overview';

@Component({
  selector: 'app-solo-planner',
  imports: [TranslateModule, Configuration, CalendarOverview],
  templateUrl: './solo-planner.html',
  styleUrl: './solo-planner.scss',
})
export class SoloPlanner {
  readonly selectedYear = signal(new Date().getFullYear());

  onYearChange(year: number): void {
    this.selectedYear.set(year);
  }
}
