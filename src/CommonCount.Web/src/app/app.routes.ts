import { Routes } from '@angular/router';
import { AuthLanding } from './features/auth/auth-landing';
import { GroupsLayout } from './features/groups/groups-layout/groups-layout';
import { GroupsOverview } from './features/groups/groups-overview/groups-overview';
import { GroupDetail } from './features/groups/group-detail/group-detail';

export const routes: Routes = [
  { path: '', redirectTo: '/main', pathMatch: 'full' },
  { path: 'main', component: AuthLanding },
  {
    path: 'groups',
    component: GroupsLayout,
    children: [
      { path: '', component: GroupsOverview },
      { path: ':id', component: GroupDetail },
    ],
  },
];
