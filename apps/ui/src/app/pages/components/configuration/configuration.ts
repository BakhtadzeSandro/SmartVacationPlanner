import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
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

  readonly periodFilters: SelectOption[] = [
    { label: 'All Year', value: 'all-year' },
    { label: 'Spring (Mar-May)', value: 'spring' },
    { label: 'Summer (Jun-Aug)', value: 'summer' },
    { label: 'Fall (Sep-Nov)', value: 'fall' },
    { label: 'Winter (Dec-Feb)', value: 'winter' },
    { label: 'January', value: 'january' },
    { label: 'February', value: 'february' },
    { label: 'March', value: 'march' },
    { label: 'April', value: 'april' },
    { label: 'May', value: 'may' },
    { label: 'June', value: 'june' },
    { label: 'July', value: 'july' },
    { label: 'August', value: 'august' },
    { label: 'September', value: 'september' },
    { label: 'October', value: 'october' },
    { label: 'November', value: 'november' },
    { label: 'December', value: 'december' },
  ];

  onSubmit(): void {
  }
}
