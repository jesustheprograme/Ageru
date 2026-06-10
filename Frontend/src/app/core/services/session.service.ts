import { Injectable, signal } from '@angular/core';
import { Account } from './account.service';

export interface SessionUser {
  id: string;
  dni: string;
  telefono: string;
  nombres: string;
  apellidos: string;
  email: string;
  fecha_nacimiento: string;
  estado: string;
}

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  readonly user = signal<SessionUser | null>(this.readStorage<SessionUser>('ageru_user'));
  readonly account = signal<Account | null>(this.readStorage<Account>('ageru_account'));
  readonly avatar = signal<string | null>(this.readText('ageru_avatar'));

  get fullName(): string {
    const user = this.user();

    if (!user) {
      return 'Usuario';
    }

    return `${user.nombres} ${user.apellidos}`.trim() || 'Usuario';
  }

  get firstName(): string {
    return this.user()?.nombres || 'Usuario';
  }

  get initials(): string {
    const user = this.user();

    if (!user) {
      return 'US';
    }

    return `${user.nombres?.[0] || ''}${user.apellidos?.[0] || ''}`.toUpperCase() || 'US';
  }

  refresh(): void {
    this.user.set(this.readStorage<SessionUser>('ageru_user'));
    this.account.set(this.readStorage<Account>('ageru_account'));
    this.avatar.set(this.readText('ageru_avatar'));
  }

  setAccount(account: Account): void {
    sessionStorage.setItem('ageru_account', JSON.stringify(account));
    this.account.set(account);
  }

  setAvatar(dataUrl: string): void {
    sessionStorage.setItem('ageru_avatar', dataUrl);
    this.avatar.set(dataUrl);
  }

  private readText(key: string): string | null {
    return sessionStorage.getItem(key) ?? localStorage.getItem(key);
  }

  private readStorage<T>(key: string): T | null {
    const rawValue = this.readText(key);

    if (!rawValue || rawValue === 'null') {
      return null;
    }

    try {
      return JSON.parse(rawValue) as T;
    } catch {
      return null;
    }
  }
}
