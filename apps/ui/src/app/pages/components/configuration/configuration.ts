import { Component, inject, output } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Select } from 'primeng/select';
import { InputNumber } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';

interface SelectOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.html',
  styleUrl: './configuration.scss',
  imports: [ReactiveFormsModule, TranslateModule, Select, InputNumber, ButtonModule],
})
export class Configuration {
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);

  readonly configForm = this.fb.group({
    country: ['georgia', { disabled: true }],
    year: ['2026'],
    ptoDays: [10],
    periodFilter: ['all-year'],
  });

  readonly yearChange = output<number>();

  readonly countries: SelectOption[] = [{ label: 'Georgia', value: 'georgia' }];

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

  constructor() {
    this.loadPeriodFilters();
    this.translate.onLangChange.subscribe(() => this.loadPeriodFilters());

    this.configForm.controls.year.valueChanges.subscribe((value) => {
      if (value) {
        this.yearChange.emit(Number(value));
      }
    });
  }

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
}
