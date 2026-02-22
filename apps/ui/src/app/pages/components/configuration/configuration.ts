import { Component, inject } from '@angular/core';
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
    country: ['georgia'],
    year: ['2026'],
    ptoDays: [15],
    periodFilter: ['all-year'],
  });

  readonly countries: SelectOption[] = [
    { label: 'Georgia', value: 'georgia' },
  ];

  readonly years: SelectOption[] = [
    { label: '2026', value: '2026' },
    { label: '2027', value: '2027' },
  ];

  periodFilters: SelectOption[] = [];

  private readonly periodFilterKeys = [
    'all-year', 'spring', 'summer', 'fall', 'winter',
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
  ];

  constructor() {
    this.loadPeriodFilters();
    this.translate.onLangChange.subscribe(() => this.loadPeriodFilters());
  }

  private loadPeriodFilters(): void {
    const keys = this.periodFilterKeys.map(k => `SoloPlanner.Period.${k}`);
    this.translate.get(keys).subscribe(translations => {
      this.periodFilters = this.periodFilterKeys.map(k => ({
        label: translations[`SoloPlanner.Period.${k}`],
        value: k,
      }));
    });
  }

  onSubmit(): void {
  }
}
