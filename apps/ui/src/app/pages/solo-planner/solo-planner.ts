import { Component } from '@angular/core';
import { Configuration } from '../components/configuration/configuration';
import { CalendarOverview } from '../components/calendar-overview/calendar-overview';

@Component({
  selector: 'app-solo-planner',
  imports: [Configuration, CalendarOverview],
  templateUrl: './solo-planner.html',
  styleUrl: './solo-planner.scss',
})
export class SoloPlanner {}
