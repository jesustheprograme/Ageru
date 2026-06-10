import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface Contact {
  id: string;
  usuario_id: string;
  contacto_usuario_id: string;
  alias: string | null;
  es_favorito: boolean;
  created_at: string;
  dni: string;
  telefono: string;
  nombres: string;
  apellidos: string;
  email: string;
  estado: string;
}

export interface ContactListResponse {
  ok: boolean;
  message: string;
  contactos: Contact[];
}

export interface CreateContactRequest {
  usuarioId: string;
  email: string;
  alias: string;
  esFavorito: boolean;
}

export interface CreateContactResponse {
  ok: boolean;
  message: string;
  contacto: Contact;
}

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/contactos';

  getUserContacts(usuarioId: string): Observable<ContactListResponse> {
    return this.http.get<ContactListResponse>(`${this.apiUrl}/usuario/${usuarioId}`);
  }

  createContact(data: CreateContactRequest): Observable<CreateContactResponse> {
    return this.http.post<CreateContactResponse>(this.apiUrl, data);
  }

  deleteContact(contactoId: string, usuarioId: string): Observable<{ ok: boolean; message: string }> {
    return this.http.delete<{ ok: boolean; message: string }>(`${this.apiUrl}/${contactoId}`, {
      body: { usuarioId },
    });
  }
}
