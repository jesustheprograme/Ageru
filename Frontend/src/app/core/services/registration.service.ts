import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface RegisterRequest {
  dni: string;
  telefono: string;
  nombres: string;
  apellidos: string;
  email: string;
  fechaNacimiento: string;
  password: string;
}

export interface RegisterResponse {
  ok: boolean;
  message: string;
  registration: {
    usuario: {
      id: string;
      dni: string;
      telefono: string;
      nombres: string;
      apellidos: string;
      email: string;
      fecha_nacimiento: string;
      estado: string;
    };
    auth: {
      usuarioId: string;
      estado: string;
    };
    cuenta: {
      id: string;
      usuario_id: string;
      numero_cuenta_enmascarado: string;
      saldo_centavos: number;
      limite_diario_centavos: number;
      estado: string;
    };
    tarjeta: {
      id: string;
      usuario_id: string;
      cuenta_id: string;
      num_tarjeta: string;
      fecha_caducidad: string;
      estado: string;
    };
  };
}

/**
 * Servicio HTTP para el alta de usuarios.
 * El backend completa el registro creando usuario, cuenta y tarjeta inicial.
 */
@Injectable({
  providedIn: 'root',
})
export class RegistrationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/auth';

  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, data);
  }
}
