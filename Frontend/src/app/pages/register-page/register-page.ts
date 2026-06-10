import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RegistrationService } from '../../core/services/registration.service';

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register-page.html',
  styleUrls: ['../login-page/login-page.css', './register-page.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Pantalla de registro.
 *
 * Recolecta datos personales, los valida localmente y envia el alta al backend.
 * La respuesta incluye cuenta y tarjeta generadas durante el registro.
 */
export class RegisterPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly registration = inject(RegistrationService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly message = signal('');

  // Mantiene las mismas reglas minimas que el backend para evitar requests invalidos.
  protected readonly form = this.fb.group({
    dni: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(8), Validators.pattern(/^\d{8}$/)]],
    telefono: ['', Validators.required],
    nombres: ['', Validators.required],
    apellidos: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    fechaNacimiento: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  /**
   * Envia el formulario de registro y muestra un mensaje de confirmacion en el dashboard.
   */
  protected save(): void {
    this.message.set('');
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.message.set('Completa los campos obligatorios.');
      return;
    }

    this.loading.set(true);

    this.registration.register(this.form.getRawValue()).subscribe({
      next: (response) => {
        const toastMessage = `${response.message}. Cuenta: ${response.registration.cuenta.numero_cuenta_enmascarado}. Tarjeta: ${response.registration.tarjeta.num_tarjeta}`;
        this.loading.set(false);
        this.router.navigate(['/index'], {
          state: { toastMessage },
        });
      },
      error: (error) => {
        this.message.set(
          error.status === 0
            ? 'No se pudo conectar con el backend. Ejecuta el servidor en Backend.'
            : error.error?.message || 'No se pudo completar el registro.',
        );
        this.loading.set(false);
      },
    });
  }

  /**
   * Mantiene el campo DNI acotado a 8 digitos desde la interaccion del usuario.
   */
  protected limitDniLength(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.slice(0, 8);

    input.value = value;
    this.form.controls.dni.setValue(value, { emitEvent: false });
  }
}
