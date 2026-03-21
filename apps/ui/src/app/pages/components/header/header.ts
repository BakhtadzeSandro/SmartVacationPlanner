import { Component, computed, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TabsModule } from 'primeng/tabs';
import { ThemeService } from '../../../core/services/theme.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [TranslateModule, TabsModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private readonly themeService = inject(ThemeService);

  readonly isDark = computed(() => this.themeService.theme() === 'dark');

  readonly tabs = [
    {
      value: 'solo-planner',
      label: 'Header.SoloPlanner',
      navigateTo: 'solo-planner',
      disabled: false,
    },
  ];

  constructor(private readonly router: Router) {}

  navigateToTab(navigateTo: string): void {
    this.router.navigate([navigateTo]);
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }
}
