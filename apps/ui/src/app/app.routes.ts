import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'main',
        pathMatch: 'full'
    },
    {
        path: 'main',
        loadComponent: () => import('./pages/main/main').then(m => m.Main),
        children: [
            {
                path: '',
                redirectTo: 'solo-planner',
                pathMatch: 'full'
            },
            {
                path: 'solo-planner',
                loadComponent: () => import('./pages/main/sections/solo-planner/solo-planner').then(m => m.SoloPlanner)
            }
        ]
    }
];
