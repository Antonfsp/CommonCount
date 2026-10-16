import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface GroupSummary {
  id: number;
  name: string;
  inviteCode: string;
  createdAt: string;
}

export interface MemberSummary {
  id: number;
  userId: number | null;
  displayName: string;
  joinedAt: string;
}
export interface CreateGroupRequest {
  name: string;
  memberName: string;
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

  createGroup(name: string, memberName: string = 'Owner'): Observable<CreateGroupResponse> {
    return this.http.post<CreateGroupResponse>(`${this.apiUrl}/create`, { name, memberName });
  }

  addMemberToGroup(groupId: number | null, memberName: string): Observable<MemberSummary> {
    if (groupId === null) {
      return throwError(() => new Error('A group is required to add a member.'));
    }
    return this.http.post<MemberSummary>(`${this.apiUrl}/${groupId}/members`, {
      displayName: memberName,
    });
  }

  updateGroupMember(
    groupId: number | null,
    memberId: number,
    displayName: string,
  ): Observable<MemberSummary> {
    if (groupId === null) {
      return throwError(() => new Error('A group is required to update a member.'));
    }

    return this.http.put<MemberSummary>(`${this.apiUrl}/${groupId}/members/${memberId}`, { displayName: displayName });
  }

  getGroupMembers(groupId: number | null): Observable<MemberSummary[]> {
    if (groupId === null) {
      return throwError(() => new Error('A group is required to load members.'));
    }
    return this.http.get<MemberSummary[]>(`${this.apiUrl}/${groupId}/members`);
  }
}
