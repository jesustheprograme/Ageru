import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { SessionService } from '../../core/services/session.service';

@Component({
  selector: 'app-profile-page',
  imports: [ReactiveFormsModule],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Perfil de usuario en modo lectura.
 * Solo permite cambiar la foto local de perfil; los datos bancarios/personales se muestran bloqueados.
 */
export class ProfilePage {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly session = inject(SessionService);
  protected readonly message = signal('');
  protected readonly successMessage = signal('');
  protected readonly isSendingCode = signal(false);
  protected readonly isVerifyingCode = signal(false);
  protected readonly smsStep = signal<'phone' | 'code'>('phone');

  protected readonly smsForm = this.fb.group({
    phone: ['', Validators.required],
    code: [''],
  });

  constructor() {
    this.session.refresh();
  }

  protected get initials(): string {
    return this.session.initials;
  }

  protected get fullName(): string {
    return this.session.fullName;
  }

  protected formatMoney(centavos: number | string | null | undefined): string {
    const amount = Number(centavos || 0) / 100;

    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(amount);
  }

  protected formatDate(value: string | null | undefined): string {
    if (!value) {
      return 'No registrado';
    }

    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(value));
  }

  protected updateAvatar(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        this.session.setAvatar(reader.result);
      }
    };

    reader.readAsDataURL(file);
  }

  protected sendSmsCode(): void {
    this.message.set('');
    this.successMessage.set('');
    this.smsForm.controls.phone.markAsTouched();

    if (this.smsForm.controls.phone.invalid) {
      this.message.set('Ingresa el telefono registrado para enviar el SMS.');
      return;
    }

    this.isSendingCode.set(true);

    this.auth.sendCode({ phone: this.smsForm.controls.phone.value.trim() }).subscribe({
      next: () => {
        this.smsStep.set('code');
        this.successMessage.set('Codigo SMS enviado. Ingresalo para vincular tus datos.');
        this.isSendingCode.set(false);
      },
      error: (error) => {
        this.message.set(this.getErrorMessage(error, 'No se pudo enviar el codigo SMS.'));
        this.isSendingCode.set(false);
      },
    });
  }

  protected verifySmsCode(): void {
    this.message.set('');
    this.successMessage.set('');
    this.smsForm.markAllAsTouched();

    if (!this.smsForm.controls.phone.value.trim() || !this.smsForm.controls.code.value.trim()) {
      this.message.set('Ingresa telefono y codigo SMS.');
      return;
    }

    this.isVerifyingCode.set(true);

    this.auth
      .verifyCode({
        phone: this.smsForm.controls.phone.value.trim(),
        code: this.smsForm.controls.code.value.trim(),
      })
      .subscribe({
        next: (response) => {
          this.auth.saveSession(response);
          this.session.refresh();
          this.successMessage.set('Datos vinculados correctamente.');
          this.smsForm.reset();
          this.smsStep.set('phone');
          this.isVerifyingCode.set(false);
        },
        error: (error) => {
          this.message.set(this.getErrorMessage(error, 'No se pudo verificar el codigo SMS.'));
          this.isVerifyingCode.set(false);
        },
      });
  }

  private getErrorMessage(error: { status?: number; error?: { message?: string } }, fallback: string): string {
    return error.status === 0 ? 'Backend no disponible.' : error.error?.message || fallback;
  }
}
