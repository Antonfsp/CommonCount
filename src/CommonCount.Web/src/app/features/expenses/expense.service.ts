import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ExpenseSummary {
  id: number;
  name: string;
  amount: number;
  payedById: number;
}

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
  name: string;
}

export interface CreateExpenseResponse {
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/expenses`;

  getExpenses(groupId: number): Observable<ExpenseListItem[]> {
    return this.http.get<ExpenseListItem[]>(`${environment.apiUrl}/groups/${groupId}/expenses`);
  }

  createExpense(name: string): Observable<CreateExpenseRequest> {
    return this.http.post<CreateExpenseResponse>(`${this.apiUrl}/create`, { name });
  }
}
