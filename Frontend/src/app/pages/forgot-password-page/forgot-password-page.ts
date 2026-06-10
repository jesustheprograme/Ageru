import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password-page.html',
  styleUrls: ['../login-page/login-page.css', './forgot-password-page.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Pantalla para solicitar recuperacion de contrasena.
 * El backend responde de forma generica para proteger la existencia de cuentas.
 */
export class ForgotPasswordPage {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly loading = signal(false);
  protected readonly message = signal('');

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  /**
   * Solicita el enlace de recuperacion al backend y refleja el resultado al usuario.
   */
  protected sendLink(): void {
    this.message.set('');
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.message.set('Ingresa un email valido.');
      return;
    }

    this.loading.set(true);

    this.auth.forgotPassword(this.form.getRawValue()).subscribe({
      next: (response) => {
        this.message.set(response.message);
        this.loading.set(false);
      },
      error: (error) => {
        this.message.set(
          error.status === 0
            ? 'Backend no disponible.'
            : error.error?.message || 'No se pudo enviar el correo.',
        );
        this.loading.set(false);
      },
    });
  }
}
