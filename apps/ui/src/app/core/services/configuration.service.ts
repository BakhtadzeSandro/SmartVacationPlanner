import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ConfigurationService {
  private readonly http = inject(HttpClient);

  getConfiguration<T extends { country_name: string; country_code: string }>() {
    return this.http.get<T>('https://ipapi.co/json/');
  }

  getPublicHolidays(year: number, countryCode: string) {
    return this.http.get(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`);
  }
}
