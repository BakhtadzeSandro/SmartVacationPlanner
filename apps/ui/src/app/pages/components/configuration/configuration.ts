import { Component, DestroyRef, inject, OnInit, input, output, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Select } from 'primeng/select';
import { InputNumber } from 'primeng/inputnumber';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { ButtonModule } from 'primeng/button';
import { Skeleton } from 'primeng/skeleton';
import { ConfigurationService } from '../../../core/services/configuration.service';
import {
  ConfigurationForm,
  CountryOption,
  PublicHoliday,
  SelectOption,
  VacationSearchParams,
} from './configuration.model';
import { EMPTY, catchError, debounceTime, forkJoin, finalize, merge, switchMap, tap } from 'rxjs';

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
  imports: [FormsModule, ReactiveFormsModule, TranslateModule, Select, InputNumber, ToggleSwitch, ButtonModule, Skeleton],
})
export class Configuration implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);
  private readonly configurationService = inject(ConfigurationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly configForm = this.buildForm();
  readonly hasSearched = input(false);

  readonly countryName = signal<string>('');
  readonly countryCode = signal<string>('');
  readonly minimumLeaveDays = signal<number | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly holidaysLoading = signal(false);
  readonly availableCountries = signal<CountryOption[]>([]);

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

  private loadPeriodFilters(): void {
    const selectedYear = this.configForm.controls.year.value;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const keys = this.periodFilterKeys.map((k) => `SoloPlanner.Period.${k}`);
    this.translate
      .get(keys)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((translations) => {
        this.periodFilters = this.periodFilterKeys.map((k) => {
          const months = PERIOD_MONTHS[k] ?? [];
          const allPast = selectedYear === currentYear && months.every((m) => m < currentMonth);
          return {
            label: translations[`SoloPlanner.Period.${k}`],
            value: k,
            disabled: allPast,
          };
        });

        const currentFilter = this.configForm.controls.periodFilter.value;
        const currentOption = this.periodFilters.find((f) => f.value === currentFilter);
        if (currentOption?.disabled) {
          this.configForm.controls.periodFilter.setValue('all-year');
        }
      });
  }

  onSubmit(): void {
    if (this.configForm.invalid) return;
    const { year, ptoDays, minPtoDays, maxPtoDays, periodFilter, enableMidWeekStarts } =
      this.configForm.getRawValue();
    this.searchChange.emit({
      year,
      ptoDays,
      minPtoDays,
      maxPtoDays,
      periodFilter,
      enableMidWeekStarts,
    });
  }

  onCountryChange(country: CountryOption): void {
    if (!country) return;
    this.countryCode.set(country.countryCode);
    this.countryName.set(country.name);
    this.loadCountryData(country.countryCode, country.name);
  }

  private loadCountryData(countryCode: string, countryName: string): void {
    const currentYear = this.configForm.controls.year.value;
    this.holidaysLoading.set(true);

    forkJoin({
      holidays: this.configurationService.getPublicHolidays(currentYear, countryCode),
      leave: this.configurationService.getMinimumLeave(countryName),
    })
      .pipe(
        tap(({ holidays, leave }) => {
          this.holidaysChange.emit(holidays);
          this.minimumLeaveDays.set(leave.minimumLeaveDays);
          if (leave.minimumLeaveDays !== null) {
            this.configForm.controls.ptoDays.setValue(leave.minimumLeaveDays);
            this.configForm.controls.maxPtoDays.setValue(leave.minimumLeaveDays);
          }
        }),
        catchError(() => {
          this.error.set(true);
          return EMPTY;
        }),
        finalize(() => this.holidaysLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private getCountryInformation(): void {
    const currentYear = this.configForm.controls.year.value;
    if (!currentYear) return;
    this.loading.set(true);
    this.error.set(false);

    forkJoin({
      countries: this.configurationService.getAvailableCountries(),
      ipDetect: this.configurationService.getConfiguration().pipe(
        catchError(() => {
          // ipapi.co failed — return null so country list still loads
          return [null];
        }),
      ),
    })
      .pipe(
        switchMap(({ countries, ipDetect }) => {
          this.availableCountries.set(countries);

          if (ipDetect) {
            this.countryName.set(ipDetect.country_name);
            this.countryCode.set(ipDetect.country_code);
          }

          const code = ipDetect?.country_code;
          if (!code) {
            // No auto-detect — just show country dropdown, user picks manually
            return EMPTY;
          }

          return forkJoin({
            holidays: this.configurationService.getPublicHolidays(currentYear, code),
            leave: this.configurationService.getMinimumLeave(ipDetect!.country_name),
          }).pipe(
            tap(({ holidays, leave }) => {
              this.holidaysChange.emit(holidays);
              this.minimumLeaveDays.set(leave.minimumLeaveDays);
              if (leave.minimumLeaveDays !== null) {
                this.configForm.controls.ptoDays.setValue(leave.minimumLeaveDays);
                this.configForm.controls.maxPtoDays.setValue(leave.minimumLeaveDays);
              }
            }),
          );
        }),
        catchError(() => {
          this.error.set(true);
          return EMPTY;
        }),
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  retry(): void {
    this.getCountryInformation();
  }

  private buildForm(): FormGroup<ConfigurationForm> {
    const fb = this.fb.nonNullable;
    return fb.group({
      year: fb.control<number>(new Date().getFullYear(), [Validators.required]),
      ptoDays: fb.control<number>(10, [Validators.required, Validators.min(1), Validators.max(50)]),
      minPtoDays: fb.control<number>(1, [Validators.required, Validators.min(1)]),
      maxPtoDays: fb.control<number>(10, [Validators.required, Validators.min(1)]),
      periodFilter: fb.control<string>('all-year'),
      enableMidWeekStarts: fb.control<boolean>(false),
    });
  }

  private listenToYearChanges(): void {
    this.configForm.controls.year.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (value) {
          this.yearChange.emit(Number(value));
          this.loadPeriodFilters();
          this.refreshHolidays(Number(value));
        }
      });
  }

  private listenToPtoChanges(): void {
    const { ptoDays, maxPtoDays, minPtoDays } = this.configForm.controls;

    ptoDays.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((pto) => {
        if (maxPtoDays.value > pto) {
          maxPtoDays.setValue(pto);
        }
        if (minPtoDays.value > maxPtoDays.value) {
          minPtoDays.setValue(maxPtoDays.value);
        }
      });

    maxPtoDays.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((maxPto) => {
        if (minPtoDays.value > maxPto) {
          minPtoDays.setValue(maxPto);
        }
      });

    minPtoDays.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((minPto) => {
        if (maxPtoDays.value < minPto) {
          maxPtoDays.setValue(minPto);
        }
      });
  }

  private listenToAutoSearch(): void {
    const { minPtoDays, maxPtoDays, ptoDays, periodFilter, enableMidWeekStarts } =
      this.configForm.controls;

    merge(
      minPtoDays.valueChanges,
      maxPtoDays.valueChanges,
      ptoDays.valueChanges,
      periodFilter.valueChanges,
      enableMidWeekStarts.valueChanges,
    )
      .pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.hasSearched()) {
          this.onSubmit();
        }
      });
  }

  private refreshHolidays(year: number): void {
    const code = this.countryCode();
    if (!code) return;
    this.holidaysLoading.set(true);
    this.configurationService
      .getPublicHolidays(year, code)
      .pipe(
        catchError(() => {
          this.error.set(true);
          return EMPTY;
        }),
        finalize(() => this.holidaysLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => {
        this.holidaysChange.emit(response);
      });
  }

  ngOnInit(): void {
    this.getCountryInformation();
    this.loadPeriodFilters();
    this.listenToYearChanges();
    this.listenToPtoChanges();
    this.listenToAutoSearch();
  }
}
