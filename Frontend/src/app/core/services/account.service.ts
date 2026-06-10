import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface Account {
  id: string;
  usuario_id: string;
  numero_cuenta_enmascarado: string;
  saldo_centavos: number;
  limite_diario_centavos: number;
  estado: string;
  created_at?: string;
  updated_at?: string;
}

export interface AccountResponse {
  ok: boolean;
  message: string;
  cuenta: Account;
}

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/cuentas';

  getUserAccount(usuarioId: string): Observable<AccountResponse> {
    return this.http.get<AccountResponse>(`${this.apiUrl}/usuario/${usuarioId}`);
  }
}
