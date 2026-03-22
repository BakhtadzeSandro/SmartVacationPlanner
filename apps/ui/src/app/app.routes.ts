import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/main/main').then((m) => m.Main),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/main/sections/solo-planner/solo-planner').then((m) => m.SoloPlanner),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
