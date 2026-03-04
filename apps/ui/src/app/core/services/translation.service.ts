import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

const LANG_KEY = 'lang';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly translate = inject(TranslateService);

  readonly currentLang = signal(this.getInitialLang());

  constructor() {
    this.translate.use(this.currentLang());
  }

  switchLanguage(lang: string): void {
    this.translate.use(lang);
    this.currentLang.set(lang);
    localStorage.setItem(LANG_KEY, lang);
  }

  private getInitialLang(): string {
    return localStorage.getItem(LANG_KEY) || this.translate.getCurrentLang() || 'en';
  }
}
