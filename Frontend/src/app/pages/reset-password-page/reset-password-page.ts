import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-reset-password-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password-page.html',
  styleUrls: ['../login-page/login-page.css', '../forgot-password-page/forgot-password-page.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Pantalla para crear una nueva contrasena desde un enlace de recuperacion.
 * Toma el token desde query params y lo envia junto con la contrasena nueva.
 */
export class ResetPasswordPage implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private redirectTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly token = this.route.snapshot.queryParamMap.get('token') || '';
  protected readonly loading = signal(false);
  protected readonly message = signal(this.token ? '' : 'El enlace no contiene token.');

  // La confirmacion se valida solo en frontend; el backend recibe password y token.
  protected readonly form = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  /**
   * Valida token, longitud y confirmacion antes de enviar la nueva contrasena.
   */
  protected savePassword(): void {
    this.message.set('');
    this.form.markAllAsTouched();

    const { password, confirmPassword } = this.form.getRawValue();

    if (!this.token) {
      this.message.set('El enlace no contiene token.');
      return;
    }

    if (this.form.invalid) {
      this.message.set('La contrasena debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      this.message.set('Las contrasenas no coinciden.');
      return;
    }

    this.loading.set(true);

    this.auth.resetPassword({ token: this.token, password }).subscribe({
      next: (response) => {
        this.message.set(response.message);
        this.loading.set(false);
        this.redirectTimer = setTimeout(() => {
          this.router.navigate(['/']);
        }, 1800);
      },
      error: (error) => {
        this.message.set(
          error.status === 0
            ? 'Backend no disponible.'
            : error.error?.message || 'No se pudo cambiar la contrasena.',
        );
        this.loading.set(false);
      },
    });
  }

  /**
   * Evita redirecciones tardias si el componente se destruye.
   */
  ngOnDestroy(): void {
    if (this.redirectTimer) {
      clearTimeout(this.redirectTimer);
    }
  }
}
