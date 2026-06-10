import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface LoginRequest {
  dni: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  ok: boolean;
  message: string;
  token: string;
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
  cuenta: {
    id: string;
    usuario_id: string;
    numero_cuenta_enmascarado: string;
    saldo_centavos: number;
    limite_diario_centavos: number;
    estado: string;
  } | null;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface SendSmsCodeRequest {
  phone: string;
}

export interface VerifySmsCodeRequest {
  phone: string;
  code: string;
}

export interface BasicAuthResponse {
  ok: boolean;
  message: string;
}

/**
 * Servicio HTTP para autenticacion.
 *
 * Agrupa llamadas al modulo /api/auth del backend y conserva la sesion minima por
 * pestana para que la demo permita probar varias cuentas en el mismo navegador.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/auth';

  login(data: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, data);
  }

  forgotPassword(data: ForgotPasswordRequest): Observable<BasicAuthResponse> {
    return this.http.post<BasicAuthResponse>(`${this.apiUrl}/forgot-password`, data);
  }

  resetPassword(data: ResetPasswordRequest): Observable<BasicAuthResponse> {
    return this.http.post<BasicAuthResponse>(`${this.apiUrl}/reset-password`, data);
  }

  sendCode(data: SendSmsCodeRequest): Observable<BasicAuthResponse> {
    return this.http.post<BasicAuthResponse>(`${this.apiUrl}/send-code`, data);
  }

  verifyCode(data: VerifySmsCodeRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/verify-code`, data);
  }

  /**
   * Persiste la sesion que devuelve el backend tras login exitoso.
   */
  saveSession(response: LoginResponse): void {
    localStorage.removeItem('ageru_token');
    localStorage.removeItem('ageru_user');
    localStorage.removeItem('ageru_account');

    sessionStorage.setItem('ageru_token', response.token);
    sessionStorage.setItem('ageru_user', JSON.stringify(response.usuario));
    sessionStorage.setItem('ageru_account', JSON.stringify(response.cuenta));
  }
}
