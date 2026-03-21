import { Component, inject, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Select } from 'primeng/select';
import { InputNumber } from 'primeng/inputnumber';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { ButtonModule } from 'primeng/button';
import { Skeleton } from 'primeng/skeleton';
import { ConfigurationService } from '../../../core/services/configuration.service';
import {
  ConfigurationForm,
  PublicHoliday,
  SelectOption,
  VacationSearchParams,
} from './configuration.model';
import { EMPTY, catchError, forkJoin, finalize, switchMap, tap } from 'rxjs';

const PERIOD_MONTHS: Record<string, number[]> = {
  'all-year': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  spring: [2, 3, 4],
  summer: [5, 6, 7],
  fall: [8, 9, 10],
  winter: [11, 0, 1],
  January: [0],
  February: [1],
  March: [2],
  April: [3],
  May: [4],
  June: [5],
  July: [6],
  August: [7],
  September: [8],
  October: [9],
  November: [10],
  December: [11],
};

@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.html',
  styleUrl: './configuration.scss',
  imports: [ReactiveFormsModule, TranslateModule, Select, InputNumber, ToggleSwitch, ButtonModule, Skeleton],
})
export class Configuration {
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);
  private readonly configurationService = inject(ConfigurationService);

  readonly configForm = signal<FormGroup<ConfigurationForm> | undefined>(undefined);

  countryName = signal<string>('');
  countryCode = signal<string>('');
  minimumLeaveDays = signal<number | null>(null);
  loading = signal(true);
  error = signal(false);

  readonly yearChange = output<number>();
  readonly holidaysChange = output<PublicHoliday[]>();
  readonly searchChange = output<VacationSearchParams>();

  readonly years: SelectOption[] = (() => {
    const current = new Date().getFullYear();
    return [current, current + 1].map((y) => ({ label: String(y), value: y }));
  })();

  periodFilters: SelectOption[] = [];

  private readonly periodFilterKeys = [
    'all-year',
    'spring',
    'summer',
    'fall',
    'winter',
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

  constructor() {}

  private loadPeriodFilters(): void {
    const selectedYear = this.configForm()?.get('year')?.value ?? new Date().getFullYear();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const keys = this.periodFilterKeys.map((k) => `SoloPlanner.Period.${k}`);
    this.translate.get(keys).subscribe((translations) => {
      this.periodFilters = this.periodFilterKeys.map((k) => {
        const months = PERIOD_MONTHS[k] ?? [];
        // Disable if all months in this period are in the past for the selected year
        const allPast = selectedYear === currentYear && months.every((m) => m < currentMonth);
        return {
          label: translations[`SoloPlanner.Period.${k}`],
          value: k,
          disabled: allPast,
        };
      });

      // If currently selected filter is now disabled, reset to 'all-year'
      const currentFilter = this.configForm()?.get('periodFilter')?.value;
      const currentOption = this.periodFilters.find((f) => f.value === currentFilter);
      if (currentOption?.disabled) {
        this.configForm()?.get('periodFilter')?.setValue('all-year');
      }
    });
  }

  onSubmit(): void {
    const form = this.configForm();
    if (!form) return;
    const { year, ptoDays, minPtoDays, maxPtoDays, periodFilter, enableMidWeekStarts } =
      form.getRawValue();
    this.searchChange.emit({
      year,
      ptoDays,
      minPtoDays,
      maxPtoDays,
      periodFilter,
      enableMidWeekStarts,
    });
  }

  private getCountryInformation(): void {
    const currentYear = this.configForm()?.get('year')?.value;
    if (!currentYear) return;
    this.loading.set(true);
    this.error.set(false);
    this.configurationService
      .getConfiguration()
      .pipe(
        switchMap((response) => {
          this.countryName.set(response.country_name);
          this.countryCode.set(response.country_code);
          return forkJoin({
            holidays: this.configurationService.getPublicHolidays(currentYear, response.country_code),
            leave: this.configurationService.getMinimumLeave(response.country_name),
          });
        }),
        tap(({ holidays, leave }) => {
          this.holidaysChange.emit(holidays);
          this.minimumLeaveDays.set(leave.minimumLeaveDays);
          const form = this.configForm();
          if (form && leave.minimumLeaveDays !== null) {
            form.get('ptoDays')!.setValue(leave.minimumLeaveDays);
            form.get('maxPtoDays')!.setValue(leave.minimumLeaveDays);
          }
        }),
        catchError(() => {
          this.error.set(true);
          return EMPTY;
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  retry(): void {
    this.getCountryInformation();
  }

  private buildForm(): void {
    const fb = this.fb.nonNullable;
    const form = fb.group({
      year: fb.control<number>(new Date().getFullYear()),
      ptoDays: fb.control<number>(10),
      minPtoDays: fb.control<number>(1),
      maxPtoDays: fb.control<number>(10),
      periodFilter: fb.control<string>('all-year'),
      enableMidWeekStarts: fb.control<boolean>(false),
    });
    this.configForm.set(form);
  }

  listenToYearChanges() {
    this.configForm()
      ?.get('year')
      ?.valueChanges.subscribe((value) => {
        if (value) {
          this.yearChange.emit(Number(value));
          this.loadPeriodFilters();
          this.refreshHolidays(Number(value));
        }
      });
  }

  private listenToPtoChanges(): void {
    const form = this.configForm();
    if (!form) return;

    form.get('ptoDays')!.valueChanges.subscribe((ptoDays) => {
      const maxCtrl = form.get('maxPtoDays')!;
      const minCtrl = form.get('minPtoDays')!;
      if (maxCtrl.value > ptoDays) {
        maxCtrl.setValue(ptoDays);
      }
      if (minCtrl.value > maxCtrl.value) {
        minCtrl.setValue(maxCtrl.value);
      }
    });

    form.get('maxPtoDays')!.valueChanges.subscribe((maxPto) => {
      const minCtrl = form.get('minPtoDays')!;
      if (minCtrl.value > maxPto) {
        minCtrl.setValue(maxPto);
      }
    });

    form.get('minPtoDays')!.valueChanges.subscribe((minPto) => {
      const maxCtrl = form.get('maxPtoDays')!;
      if (maxCtrl.value < minPto) {
        maxCtrl.setValue(minPto);
      }
    });
  }

  private refreshHolidays(year: number): void {
    const code = this.countryCode();
    if (!code) return;
    this.configurationService
      .getPublicHolidays(year, code)
      .pipe(catchError(() => EMPTY))
      .subscribe((response) => {
        this.holidaysChange.emit(response);
      });
  }

  listenToLanguageChanges() {
    this.translate.onLangChange.subscribe(() => this.loadPeriodFilters());
  }

  ngOnInit(): void {
    this.buildForm();
    this.getCountryInformation();
    this.listenToLanguageChanges();
    this.loadPeriodFilters();
    this.listenToYearChanges();
    this.listenToPtoChanges();
  }
}
