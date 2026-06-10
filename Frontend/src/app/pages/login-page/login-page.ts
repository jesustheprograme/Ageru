import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Pantalla de inicio de sesion.
 *
 * Usa formularios reactivos para validar DNI, email y contrasena antes de llamar
 * al backend. Al recibir la sesion, la guarda y redirige al dashboard.
 */
export class LoginPage implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private redirectTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly isLoading = signal(false);
  protected readonly isRedirecting = signal(false);
  protected readonly message = signal('');

  // El DNI peruano se limita a 8 digitos para coincidir con la validacion del backend.
  protected readonly form = this.fb.group({
    dni: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(8), Validators.pattern(/^\d{8}$/)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  /**
   * Recorta el DNI desde el input para evitar que el formulario acepte caracteres extra.
   */
  protected limitDniLength(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.slice(0, 8);

    input.value = value;
    this.form.controls.dni.setValue(value, { emitEvent: false });
  }

  /**
   * Ejecuta el login y administra los estados visibles de carga, error y redireccion.
   */
  protected startLogin(): void {
    this.message.set('');
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.message.set('Revisa DNI, email y contrasena.');
      return;
    }

    this.isLoading.set(true);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: (response) => {
        this.auth.saveSession(response);
        this.isLoading.set(false);
        this.isRedirecting.set(true);
        this.redirectTimer = setTimeout(() => {
          this.router.navigate(['/index']);
        }, 2000);
      },
      error: (error) => {
        this.message.set(
          error.status === 0
            ? 'Backend no disponible.'
            : error.error?.message || 'Credenciales invalidas.',
        );
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Limpia el temporizador de redireccion si el usuario abandona la pantalla.
   */
  ngOnDestroy(): void {
    if (this.redirectTimer) {
      clearTimeout(this.redirectTimer);
    }
  }
}
