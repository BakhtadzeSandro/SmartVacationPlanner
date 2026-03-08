import { FormControl } from '@angular/forms';

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface ConfigurationForm {
  year: FormControl<number>;
  ptoDays: FormControl<number>;
  periodFilter: FormControl<string>;
}
