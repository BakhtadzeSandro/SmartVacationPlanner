import { Component, inject, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Select } from 'primeng/select';
import { InputNumber } from 'primeng/inputnumber';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { ButtonModule } from 'primeng/button';
import { ConfigurationService } from '../../../core/services/configuration.service';
import { ConfigurationForm, PublicHoliday, SelectOption, VacationSearchParams } from './configuration.model';
import { switchMap, tap } from 'rxjs';

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
  imports: [ReactiveFormsModule, TranslateModule, Select, InputNumber, ToggleSwitch, ButtonModule],
})
export class Configuration {
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);
  private readonly configurationService = inject(ConfigurationService);

  readonly configForm = signal<FormGroup<ConfigurationForm> | undefined>(undefined);

  countryName = signal<string>('');
  countryCode = signal<string>('');

  readonly yearChange = output<number>();
  readonly holidaysChange = output<PublicHoliday[]>();
  readonly searchChange = output<VacationSearchParams>();

  readonly years: SelectOption[] = [
    { label: '2026', value: 2026 },
    { label: '2027', value: 2027 },
  ];

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
        const allPast =
          selectedYear === currentYear && months.every((m) => m < currentMonth);
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
    const { year, ptoDays, minPtoDays, maxPtoDays, periodFilter, enableMidWeekStarts } = form.getRawValue();
    this.searchChange.emit({ year, ptoDays, minPtoDays, maxPtoDays, periodFilter, enableMidWeekStarts });
  }

  private getCountryInformation(): void {
    const currentYear = this.configForm()?.get('year')?.value;
    if (!currentYear) return;
    this.configurationService
      .getConfiguration()
      .pipe(
        switchMap((response) => {
          this.countryName.set(response.country_name);
          this.countryCode.set(response.country_code);
          return this.configurationService.getPublicHolidays(currentYear, response.country_code);
        }),
        tap((response) => {
          this.holidaysChange.emit(response);
        }),
      )
      .subscribe();
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
