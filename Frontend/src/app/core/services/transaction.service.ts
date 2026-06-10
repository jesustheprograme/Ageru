import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Account } from './account.service';

export type TransactionDirection = 'entrada' | 'salida' | 'neutra';

export interface Transaction {
  id: string;
  cuenta_origen_id: string | null;
  cuenta_destino_id: string | null;
  monto_centavos: number;
  tipo: string;
  estado: string;
  descripcion: string | null;
  referencia_externa: string | null;
  created_at: string;
  cuenta_origen_codigo?: string | null;
  cuenta_destino_codigo?: string | null;
  direccion?: TransactionDirection;
}

export interface TransactionListResponse {
  ok: boolean;
  message: string;
  transacciones: Transaction[];
}

export interface SendTransactionCodeRequest {
  usuarioId: string;
  cuentaOrigenId: string;
  codigoCuentaDestino: string;
  contactoId?: string;
  monto: number;
}

export interface ConfirmTransactionRequest extends SendTransactionCodeRequest {
  descripcion: string;
  code: string;
}

export interface ConfirmTransactionResponse {
  ok: boolean;
  message: string;
  transaccion: Transaction;
  cuentaOrigen: Account;
  cuentaDestino: Account;
}

export type AccountOperationType = 'recarga' | 'retiro' | 'pago_servicio';

export interface CreateAccountOperationRequest {
  usuarioId: string;
  cuentaId: string;
  tipo: AccountOperationType;
  monto: number;
  descripcion: string;
}

export interface CreateAccountOperationResponse {
  ok: boolean;
  message: string;
  transaccion: Transaction;
  cuenta: Account;
}

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/transacciones';

  getUserTransactions(usuarioId: string): Observable<TransactionListResponse> {
    return this.http.get<TransactionListResponse>(`${this.apiUrl}/usuario/${usuarioId}`);
  }

  getAccountTransactions(usuarioId: string, cuentaId: string): Observable<TransactionListResponse> {
    return this.http.get<TransactionListResponse>(`${this.apiUrl}/usuario/${usuarioId}/cuenta/${cuentaId}`);
  }

  confirm(data: ConfirmTransactionRequest): Observable<ConfirmTransactionResponse> {
    return this.http.post<ConfirmTransactionResponse>(`${this.apiUrl}/confirm`, data);
  }

  createOperation(data: CreateAccountOperationRequest): Observable<CreateAccountOperationResponse> {
    return this.http.post<CreateAccountOperationResponse>(`${this.apiUrl}/operacion`, data);
  }
}
