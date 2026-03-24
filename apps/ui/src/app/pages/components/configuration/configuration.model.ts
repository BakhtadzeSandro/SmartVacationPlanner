import { FormControl } from '@angular/forms';

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
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
  minPtoDays: FormControl<number>;
  maxPtoDays: FormControl<number>;
  periodFilter: FormControl<string>;
  enableMidWeekStarts: FormControl<boolean>;
  minGapDays: FormControl<number>;
}

export interface CountryOption {
  countryCode: string;
  name: string;
}

export interface SubdivisionOption {
  code: string;
  name: string;
}

export interface OpenHolidayName {
  language: string;
  text: string;
}

export interface OpenHolidaySubdivision {
  code: string;
  shortName: string;
}

export interface OpenHolidayResponse {
  id: string;
  startDate: string;
  endDate: string;
  type: string;
  name: OpenHolidayName[];
  regionalScope: string;
  temporalScope: string;
  nationwide: boolean;
  subdivisions?: OpenHolidaySubdivision[];
}

export interface OpenSubdivisionResponse {
  code: string;
  isoCode: string;
  shortName: string;
  name: OpenHolidayName[];
  category: OpenHolidayName[];
  officialLanguages: string[];
  children?: OpenSubdivisionResponse[];
}

export interface VacationSearchParams {
  year: number;
  ptoDays: number;
  minPtoDays: number;
  maxPtoDays: number;
  periodFilter: string;
  enableMidWeekStarts: boolean;
  minGapDays: number;
}
