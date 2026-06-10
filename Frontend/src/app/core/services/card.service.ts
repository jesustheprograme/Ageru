import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface Card {
  id: string;
  usuario_id: string;
  cuenta_id: string;
  num_tarjeta: string;
  fecha_caducidad: string;
  estado: string;
}

export interface CardListResponse {
  ok: boolean;
  message: string;
  tarjetas: Card[];
}

export interface CreateCardRequest {
  usuarioId: string;
  cuentaId: string;
  numTarjeta: string;
  fechaCaducidad: string;
  cvv: string;
}

@Injectable({
  providedIn: 'root',
})
export class CardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/tarjetas';

  getUserCards(usuarioId: string): Observable<CardListResponse> {
    return this.http.get<CardListResponse>(`${this.apiUrl}/usuario/${usuarioId}`);
  }

  createCard(data: CreateCardRequest): Observable<{ ok: boolean; message: string; tarjeta: Card }> {
    return this.http.post<{ ok: boolean; message: string; tarjeta: Card }>(this.apiUrl, data);
  }
}
