import { Routes } from '@angular/router';
import { Main } from './features/auth/main';
import { GroupsOverview } from './features/groups/groups-overview/groups-overview';

export const routes: Routes = [
  { path: '', redirectTo: '/main', pathMatch: 'full' },
  { path: 'main', component: Main },
  { path: 'groups', component: GroupsOverview }
];
