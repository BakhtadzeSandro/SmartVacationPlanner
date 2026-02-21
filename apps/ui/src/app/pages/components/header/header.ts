import { Component, computed, ElementRef, HostListener, inject, signal } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ThemeService } from '../../../core/services/theme.service';
import { TranslationService } from '../../../core/services/translation.service';

interface Language {
  code: string;
  label: string;
}

@Component({
  selector: 'app-header',
  imports: [TranslateModule, UpperCasePipe],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private readonly elementRef = inject(ElementRef);
  private readonly themeService = inject(ThemeService);
  private readonly translationService = inject(TranslationService);

  readonly isDark = computed(() => this.themeService.theme() === 'dark');
  readonly currentLang = this.translationService.currentLang;
  readonly langDropdownOpen = signal(false);

  readonly languages: Language[] = [
    { code: 'en', label: 'English' },
    { code: 'ka', label: 'Georgian' },
  ];

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.langDropdownOpen.set(false);
    }
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  toggleLangDropdown(): void {
    this.langDropdownOpen.update(open => !open);
  }

  switchLanguage(lang: string): void {
    this.translationService.switchLanguage(lang);
    this.langDropdownOpen.set(false);
  }
}
