import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ExpenseListItem {
  id: number;
  description: string;
  amount: number;
  date: string;
  paidByMember: {
    id: number;
    name: string;
  };
}

export interface CreateExpenseRequest {
  description: string;
  amount: number;
  paidByMemberId: number;
  participantMemberIds: number[];
}

export interface CreateExpenseResponse {
  id: number;
  description: string;
  amount: number;
  date: string;
}

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly http = inject(HttpClient);

  getExpenses(groupId: number): Observable<ExpenseListItem[]> {
    return this.http.get<ExpenseListItem[]>(`${environment.apiUrl}/groups/${groupId}/expenses`);
  }

  createExpense(groupId: number, request: CreateExpenseRequest): Observable<CreateExpenseResponse> {
    return this.http.post<CreateExpenseResponse>(
      `${environment.apiUrl}/groups/${groupId}/expenses`,
      request,
    );
  }
}
