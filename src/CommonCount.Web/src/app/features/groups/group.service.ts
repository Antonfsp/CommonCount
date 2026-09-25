import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface GroupSummary {
  id: number;
  name: string;
  inviteCode: string;
  createdAt: string;
}

export interface CreateGroupRequest {
  name: string;
}

export interface CreateGroupResponse {
  id: number;
  name: string;
  inviteCode: string;
}

@Injectable({ providedIn: 'root' })
export class GroupService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/groups`;

  getMyGroups(): Observable<GroupSummary[]> {
    return this.http.get<GroupSummary[]>(`${this.apiUrl}/`);
  }

  createGroup(name: string): Observable<CreateGroupResponse> {
    return this.http.post<CreateGroupResponse>(`${this.apiUrl}/create`, { name });
  }
}
