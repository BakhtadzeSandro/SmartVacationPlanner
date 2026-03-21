import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of, map, catchError } from 'rxjs';
import { PublicHoliday } from '../../pages/components/configuration/configuration.model';

const WIKIPEDIA_API_URL =
  'https://en.wikipedia.org/w/api.php?action=parse&page=List_of_minimum_annual_leave_by_country&prop=text&format=json&origin=*';

@Injectable({ providedIn: 'root' })
export class ConfigurationService {
  private readonly http = inject(HttpClient);
  private leaveCache: Map<string, number> | null = null;

  getConfiguration<T extends { country_name: string; country_code: string }>() {
    return this.http.get<T>('https://ipapi.co/json/');
  }

  getPublicHolidays(year: number, countryCode: string) {
    return this.http.get<PublicHoliday[]>(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`);
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
      .trim()
      .toLowerCase();
  }
}
