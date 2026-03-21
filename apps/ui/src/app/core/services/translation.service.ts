import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly translate = inject(TranslateService);

  readonly currentLang = signal('en');

  constructor() {
    this.translate.use('en');
  }
}
