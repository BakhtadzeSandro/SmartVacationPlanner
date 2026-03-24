import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of, map, tap, catchError } from 'rxjs';
import {
  CountryOption,
  PublicHoliday,
  SubdivisionOption,
  OpenHolidayResponse,
  OpenSubdivisionResponse,
} from '../../pages/components/configuration/configuration.model';

const WIKIPEDIA_API_URL =
  'https://en.wikipedia.org/w/api.php?action=parse&page=List_of_minimum_annual_leave_by_country&prop=text&format=json&origin=*';

@Injectable({ providedIn: 'root' })
export class ConfigurationService {
  private readonly http = inject(HttpClient);
  private leaveCache: Map<string, number> | null = null;
  private countriesCache: CountryOption[] | null = null;
  private subdivisionsCache = new Map<string, SubdivisionOption[]>();

  getConfiguration<T extends { country_name: string; country_code: string }>() {
    return this.http.get<T>('https://ipapi.co/json/');
  }

  getAvailableCountries(): Observable<CountryOption[]> {
    if (this.countriesCache) {
      return of(this.countriesCache);
    }
    return this.http
      .get<CountryOption[]>('https://date.nager.at/api/v3/AvailableCountries')
      .pipe(
        map((countries) => countries.sort((a, b) => a.name.localeCompare(b.name))),
        tap((countries) => (this.countriesCache = countries)),
      );
  }

  getPublicHolidays(year: number, countryCode: string) {
    return this.http.get<PublicHoliday[]>(
      `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`,
    );
  }

  getSubdivisions(countryCode: string): Observable<SubdivisionOption[]> {
    const cached = this.subdivisionsCache.get(countryCode);
    if (cached) return of(cached);

    return this.http
      .get<OpenSubdivisionResponse[]>(
        `https://openholidaysapi.org/Subdivisions?countryIsoCode=${countryCode}`,
      )
      .pipe(
        map((items) =>
          items.map((item) => ({
            code: item.code,
            name: this.extractEnglishName(item.name) || item.shortName,
          })),
        ),
        tap((subdivisions) => this.subdivisionsCache.set(countryCode, subdivisions)),
        catchError(() => of([])),
      );
  }

  getOpenHolidays(
    year: number,
    countryCode: string,
    subdivisionCode?: string,
  ): Observable<PublicHoliday[]> {
    let url =
      `https://openholidaysapi.org/PublicHolidays` +
      `?countryIsoCode=${countryCode}&languageIsoCode=EN` +
      `&validFrom=${year}-01-01&validTo=${year}-12-31`;

    if (subdivisionCode) {
      url += `&subdivisionCode=${subdivisionCode}`;
    }

    return this.http.get<OpenHolidayResponse[]>(url).pipe(
      map((items) =>
        items.map((item) => ({
          date: item.startDate,
          localName: this.extractName(item.name, 'DE') || this.extractEnglishName(item.name) || '',
          name: this.extractEnglishName(item.name) || '',
          countryCode,
          fixed: false,
          global: item.nationwide,
          counties: item.subdivisions?.map((s) => s.code) ?? null,
          launchYear: null,
          types: [item.type],
        })),
      ),
    );
  }

  private extractEnglishName(names: { language: string; text: string }[]): string {
    return names.find((n) => n.language === 'EN')?.text ?? names[0]?.text ?? '';
  }

  private extractName(names: { language: string; text: string }[], lang: string): string {
    return names.find((n) => n.language === lang)?.text ?? '';
  }

  getMinimumLeave(countryName: string): Observable<{ minimumLeaveDays: number | null }> {
    if (this.leaveCache) {
      return of({ minimumLeaveDays: this.lookupCountry(countryName) });
    }

    return this.http.get<{ parse: { text: Record<string, string> } }>(WIKIPEDIA_API_URL).pipe(
      map((response) => {
        const html = response.parse.text['*'];
        this.leaveCache = this.parseLeaveTable(html);
        return { minimumLeaveDays: this.lookupCountry(countryName) };
      }),
      catchError(() => of({ minimumLeaveDays: null })),
    );
  }

  private lookupCountry(countryName: string): number | null {
    const normalized = this.normalizeCountryName(countryName);
    return this.leaveCache?.get(normalized) ?? null;
  }

  private parseLeaveTable(html: string): Map<string, number> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const data = new Map<string, number>();

    doc.querySelectorAll('table.wikitable tbody tr').forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 2) return;

      const rawCountry = (cells[0].textContent ?? '').trim();
      const rawDays = (cells[1].textContent ?? '').trim();

      const country = this.normalizeCountryName(rawCountry);
      if (!country) return;

      const match = rawDays.match(/^(\d+)/);
      if (match) {
        data.set(country, parseInt(match[1], 10));
      }
    });

    return data;
  }

  private normalizeCountryName(name: string): string {
    return name
      .replace(/\[.*?\]/g, '')
      .replace(/\(.*?\)/g, '')
      .replace(/^the\s+/i, '')
      .trim()
      .toLowerCase();
  }
}
