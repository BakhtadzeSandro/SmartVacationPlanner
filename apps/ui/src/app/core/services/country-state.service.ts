import { Injectable, inject, signal } from '@angular/core';
import { EMPTY, catchError, forkJoin, finalize } from 'rxjs';
import { ConfigurationService } from './configuration.service';
import {
  CountryOption,
  SubdivisionOption,
} from '../../pages/components/configuration/configuration.model';

const COUNTRIES_WITH_REGIONAL_HOLIDAYS = new Set([
  'DE', // Germany
  'ES', // Spain
  'CH', // Switzerland
]);

@Injectable({ providedIn: 'root' })
export class CountryStateService {
  private readonly configurationService = inject(ConfigurationService);

  readonly availableCountries = signal<CountryOption[]>([]);
  readonly countryCode = signal('');
  readonly countryName = signal('');
  readonly loading = signal(false);
  readonly error = signal(false);

  readonly subdivisions = signal<SubdivisionOption[]>([]);
  readonly subdivisionCode = signal('');
  readonly subdivisionName = signal('');
  readonly subdivisionsLoading = signal(false);

  private initialized = false;

  initialize(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.loading.set(true);
    this.error.set(false);

    forkJoin({
      countries: this.configurationService.getAvailableCountries(),
      ipDetect: this.configurationService.getConfiguration().pipe(
        catchError(() => [null]),
      ),
    })
      .pipe(
        catchError(() => {
          this.error.set(true);
          return EMPTY;
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe(({ countries, ipDetect }) => {
        this.availableCountries.set(countries);

        if (ipDetect) {
          this.countryCode.set(ipDetect.country_code);
          this.countryName.set(ipDetect.country_name);
          this.loadSubdivisions(ipDetect.country_code);
        }
      });
  }

  selectCountry(country: CountryOption): void {
    this.countryCode.set(country.countryCode);
    this.countryName.set(country.name);
    this.clearSubdivision();
    this.loadSubdivisions(country.countryCode);
  }

  selectSubdivision(subdivision: SubdivisionOption | null): void {
    this.subdivisionCode.set(subdivision?.code ?? '');
    this.subdivisionName.set(subdivision?.name ?? '');
  }

  retry(): void {
    this.initialized = false;
    this.initialize();
  }

  private loadSubdivisions(countryCode: string): void {
    if (!COUNTRIES_WITH_REGIONAL_HOLIDAYS.has(countryCode)) return;

    this.subdivisionsLoading.set(true);
    this.configurationService
      .getSubdivisions(countryCode)
      .pipe(finalize(() => this.subdivisionsLoading.set(false)))
      .subscribe((result) => {
        this.subdivisions.set(result);
        if (result.length > 0) {
          this.subdivisionCode.set(result[0].code);
          this.subdivisionName.set(result[0].name);
        }
      });
  }

  private clearSubdivision(): void {
    this.subdivisions.set([]);
    this.subdivisionCode.set('');
    this.subdivisionName.set('');
  }
}
