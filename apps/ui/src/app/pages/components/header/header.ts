import { Component, computed, inject } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Popover } from 'primeng/popover';
import { TabsModule } from 'primeng/tabs';
import { ThemeService } from '../../../core/services/theme.service';
import { TranslationService } from '../../../core/services/translation.service';
import { Router } from '@angular/router';

interface Language {
  code: string;
  label: string;
}

@Component({
  selector: 'app-header',
  imports: [TranslateModule, UpperCasePipe, Popover, TabsModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private readonly themeService = inject(ThemeService);
  private readonly translationService = inject(TranslationService);

  readonly isDark = computed(() => this.themeService.theme() === 'dark');
  readonly currentLang = this.translationService.currentLang;

  readonly languages: Language[] = [
    { code: 'en', label: 'English' },
    { code: 'ka', label: 'Georgian' },
  ];

  readonly tabs = [
    {
      value: 'solo-planner',
      label: 'Header.SoloPlanner',
      navigateTo: 'solo-planner',
      disabled: false,
    },
    {
      value: 'group-planner',
      label: 'Header.GroupPlanner',
      navigateTo: 'group-planner',
      disabled: true,
    },
    { value: 'my-groups', label: 'Header.MyGroups', navigateTo: 'my-groups', disabled: true },
  ];

  constructor(private readonly router: Router) {}

  navigateToTab(navigateTo: string): void {
    this.router.navigate([navigateTo]);
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  switchLanguage(lang: string): void {
    this.translationService.switchLanguage(lang);
  }
}
