import { Injectable, inject, signal } from '@angular/core';
import { EMPTY, catchError, forkJoin, finalize } from 'rxjs';
import { ConfigurationService } from './configuration.service';
import { CountryOption } from '../../pages/components/configuration/configuration.model';

@Injectable({ providedIn: 'root' })
export class CountryStateService {
  private readonly configurationService = inject(ConfigurationService);

  readonly availableCountries = signal<CountryOption[]>([]);
  readonly countryCode = signal('');
  readonly countryName = signal('');
  readonly loading = signal(false);
  readonly error = signal(false);

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
        }
      });
  }

  selectCountry(country: CountryOption): void {
    this.countryCode.set(country.countryCode);
    this.countryName.set(country.name);
  }

  retry(): void {
    this.initialized = false;
    this.initialize();
  }
}
