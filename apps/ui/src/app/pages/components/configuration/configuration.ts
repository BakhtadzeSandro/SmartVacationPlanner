import { Component, inject, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Select } from 'primeng/select';
import { InputNumber } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { ConfigurationService } from '../../../core/services/configuration.service';
import { ConfigurationForm, SelectOption } from './configuration.model';
import { switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.html',
  styleUrl: './configuration.scss',
  imports: [ReactiveFormsModule, TranslateModule, Select, InputNumber, ButtonModule],
})
export class Configuration {
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);
  private readonly configurationService = inject(ConfigurationService);

  readonly configForm = signal<FormGroup<ConfigurationForm> | undefined>(undefined);

  countryName = signal<string>('');
  countryCode = signal<string>('');

  readonly yearChange = output<number>();

  readonly years: SelectOption[] = [
    { label: '2026', value: '2026' },
    { label: '2027', value: '2027' },
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
    const keys = this.periodFilterKeys.map((k) => `SoloPlanner.Period.${k}`);
    this.translate.get(keys).subscribe((translations) => {
      this.periodFilters = this.periodFilterKeys.map((k) => ({
        label: translations[`SoloPlanner.Period.${k}`],
        value: k,
      }));
    });
  }

  onSubmit(): void {}

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
          console.log(response);
        }),
      )
      .subscribe();
  }

  private buildForm(): void {
    const fb = this.fb.nonNullable;
    const form = fb.group({
      year: fb.control<number>(new Date().getFullYear()),
      ptoDays: fb.control<number>(10),
      periodFilter: fb.control<string>('all-year'),
    });
    this.configForm.set(form);
  }

  listenToYearChanges() {
    this.configForm()
      ?.get('year')
      ?.valueChanges.subscribe((value) => {
        if (value) {
          this.yearChange.emit(Number(value));
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
  }
}
