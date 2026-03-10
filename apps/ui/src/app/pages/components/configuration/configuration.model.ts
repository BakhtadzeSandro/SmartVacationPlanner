import { FormControl } from '@angular/forms';

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface PublicHoliday {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  counties: string[] | null;
  launchYear: number | null;
  types: string[];
}

export interface ConfigurationForm {
  year: FormControl<number>;
  ptoDays: FormControl<number>;
  periodFilter: FormControl<string>;
}
