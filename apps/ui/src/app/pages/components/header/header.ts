import { Component, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TabsModule } from 'primeng/tabs';
import { Select } from 'primeng/select';
import { Skeleton } from 'primeng/skeleton';
import { ButtonModule } from 'primeng/button';
import { ThemeService } from '../../../core/services/theme.service';
import { CountryStateService } from '../../../core/services/country-state.service';
import { CountryOption, SubdivisionOption } from '../configuration/configuration.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [TranslateModule, TabsModule, FormsModule, Select, Skeleton, ButtonModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit {
  private readonly themeService = inject(ThemeService);
  readonly countryState = inject(CountryStateService);

  readonly isDark = computed(() => this.themeService.theme() === 'dark');

  readonly selectedCountryObject = computed<CountryOption | null>(() => {
    const code = this.countryState.countryCode();
    const name = this.countryState.countryName();
    return code ? { countryCode: code, name } : null;
  });

  readonly selectedSubdivisionObject = computed<SubdivisionOption | null>(() => {
    const code = this.countryState.subdivisionCode();
    const name = this.countryState.subdivisionName();
    return code ? { code, name } : null;
  });

  readonly tabs = [
    {
      value: 'solo-planner',
      label: 'Header.SoloPlanner',
      navigateTo: 'solo-planner',
      disabled: false,
    },
  ];

  constructor(private readonly router: Router) {}

  ngOnInit(): void {
    this.countryState.initialize();
  }

  navigateToTab(navigateTo: string): void {
    this.router.navigate([navigateTo]);
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  onCountryChange(country: CountryOption): void {
    if (!country) return;
    this.countryState.selectCountry(country);
  }

  onSubdivisionChange(subdivision: SubdivisionOption | null): void {
    this.countryState.selectSubdivision(subdivision);
  }

  retryCountryLoad(): void {
    this.countryState.retry();
  }
}
