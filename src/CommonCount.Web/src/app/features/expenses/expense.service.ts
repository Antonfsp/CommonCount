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
  participants: {
    memberId: number;
    shareAmount: number;
  }[];
}

export interface ExpenseRequest {
  description: string;
  amount: number;
  paidByMemberId: number;
  participantMemberIds: number[];
}

export interface ExpenseResponse {
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

  createExpense(groupId: number, request: ExpenseRequest): Observable<ExpenseResponse> {
    return this.http.post<ExpenseResponse>(
      `${environment.apiUrl}/groups/${groupId}/expenses`,
      request,
    );
  }

  editExpense(groupId: number, expenseId: number, request: ExpenseRequest): Observable<ExpenseResponse> {
    return this.http.put<ExpenseResponse>(
      `${environment.apiUrl}/groups/${groupId}/expenses/${expenseId}`,
      request,
    );
  }
}
