import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Card, CardService } from '../../core/services/card.service';
import { SessionService } from '../../core/services/session.service';
import { AccountOperationType, Transaction, TransactionService } from '../../core/services/transaction.service';

interface OperationAction {
  label: string;
  value: string;
}

interface OperationContent {
  kind: AccountOperationType | 'transferencia';
  eyebrow: string;
  title: string;
  description: string;
  summary: OperationAction[];
  fields: string[];
  steps: string[];
  notes: string[];
  cta: string;
  detailLabel: string;
  detailPlaceholder: string;
}

const OPERATION_CONTENT: Record<string, OperationContent> = {
  Transferir: {
    kind: 'transferencia',
    eyebrow: 'Operacion bancaria',
    title: 'Transferir dinero',
    description: 'Envia dinero a una cuenta Ageru usando codigo de cuenta o contacto frecuente.',
    summary: [
      { label: 'Validacion', value: 'SMS / OTP' },
      { label: 'Tiempo estimado', value: 'Inmediato' },
      { label: 'Comision', value: 'S/ 0.00' },
    ],
    fields: ['Cuenta origen', 'Codigo de cuenta destino', 'Monto', 'Descripcion opcional'],
    steps: ['Ingresa el codigo de destino.', 'Confirma el monto antes de continuar.', 'Valida la operacion con tu codigo SMS.'],
    notes: ['Revisa que el codigo pertenezca al destinatario correcto.', 'El movimiento aparecera en tu historial al completarse.'],
    cta: 'Ir a movimientos para transferir',
    detailLabel: 'Destino',
    detailPlaceholder: 'Codigo de cuenta destino',
  },
  Recargar: {
    kind: 'recarga',
    eyebrow: 'Ingreso de saldo',
    title: 'Recargar cuenta',
    description: 'Agrega saldo a tu cuenta principal desde una tarjeta, agente o metodo vinculado.',
    summary: [
      { label: 'Destino', value: 'Cuenta principal' },
      { label: 'Disponibilidad', value: '24/7' },
      { label: 'Confirmacion', value: 'SMS' },
    ],
    fields: ['Metodo de recarga', 'Monto', 'Cuenta destino', 'Referencia'],
    steps: ['Elige el metodo de recarga.', 'Confirma el monto a ingresar.', 'Guarda el comprobante de la operacion.'],
    notes: ['Las recargas por agente pueden tardar unos minutos.', 'Manten tu comprobante hasta ver el saldo actualizado.'],
    cta: 'Preparar recarga',
    detailLabel: 'Metodo',
    detailPlaceholder: 'Tarjeta, agente o deposito',
  },
  Retirar: {
    kind: 'retiro',
    eyebrow: 'Salida de saldo',
    title: 'Retirar dinero',
    description: 'Solicita retiro desde tu cuenta principal hacia un agente, cajero o cuenta vinculada.',
    summary: [
      { label: 'Origen', value: 'Saldo disponible' },
      { label: 'Seguridad', value: 'Codigo SMS' },
      { label: 'Estado', value: 'Pendiente' },
    ],
    fields: ['Canal de retiro', 'Monto', 'Documento', 'Codigo de autorizacion'],
    steps: ['Selecciona el canal de retiro.', 'Verifica saldo y limite diario.', 'Presenta el codigo generado al retirar.'],
    notes: ['El retiro depende del saldo disponible.', 'El codigo de retiro debe tratarse como informacion privada.'],
    cta: 'Generar solicitud de retiro',
    detailLabel: 'Canal',
    detailPlaceholder: 'Agente, cajero o cuenta vinculada',
  },
  'Pagar servicios': {
    kind: 'pago_servicio',
    eyebrow: 'Pagos',
    title: 'Pagar servicios',
    description: 'Centraliza pagos de luz, agua, internet y otros servicios desde tu cuenta Ageru.',
    summary: [
      { label: 'Servicios', value: 'Hogar y pagos' },
      { label: 'Registro', value: 'Historial' },
      { label: 'Comprobante', value: 'Digital' },
    ],
    fields: ['Categoria', 'Empresa', 'Codigo de cliente', 'Monto a pagar'],
    steps: ['Busca la empresa o servicio.', 'Ingresa el codigo de cliente.', 'Confirma el pago y descarga el comprobante.'],
    notes: ['Verifica que el recibo corresponda al periodo correcto.', 'Los pagos confirmados no se pueden editar desde la app.'],
    cta: 'Buscar servicio',
    detailLabel: 'Servicio',
    detailPlaceholder: 'Empresa y codigo de cliente',
  },
};

@Component({
  selector: 'app-placeholder-page',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './placeholder-page.html',
  styleUrl: './placeholder-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Vista reutilizable para secciones planificadas y contenido de operaciones.
 */
export class PlaceholderPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cardsService = inject(CardService);
  protected readonly session = inject(SessionService);
  private readonly transactions = inject(TransactionService);

  protected readonly title = this.route.snapshot.data['title'] ?? 'Seccion';
  protected readonly description = this.route.snapshot.data['description'] ?? 'Esta opcion quedo lista para conectar su flujo.';
  protected readonly operation = OPERATION_CONTENT[this.title] ?? null;
  protected readonly message = signal('');
  protected readonly successMessage = signal('');
  protected readonly isSubmitting = signal(false);
  protected readonly cards = signal<Card[]>([]);
  protected readonly movements = signal<Transaction[]>([]);
  protected readonly supportSent = signal(false);

  protected readonly form = this.fb.group({
    detail: ['', Validators.required],
    amount: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
    reference: [''],
  });

  protected readonly cardForm = this.fb.group({
    numTarjeta: ['', [Validators.required, Validators.minLength(4)]],
    fechaCaducidad: ['', Validators.required],
    cvv: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(4)]],
  });

  protected readonly supportForm = this.fb.group({
    subject: ['', Validators.required],
    detail: ['', Validators.required],
  });

  constructor() {
    this.session.refresh();
    this.loadSectionData();
  }

  protected get currentBalance(): string {
    return this.formatMoney(this.session.account()?.saldo_centavos);
  }

  protected get isManagementSection(): boolean {
    return ['Cuentas', 'Tarjetas', 'Limites', 'Seguridad', 'Soporte'].includes(this.title);
  }

  protected get spentToday(): number {
    const today = new Date().toISOString().slice(0, 10);

    return this.movements()
      .filter((movement) => movement.direccion === 'salida' && movement.created_at?.slice(0, 10) === today)
      .reduce((total, movement) => total + Number(movement.monto_centavos || 0), 0);
  }

  protected get availableDailyLimit(): number {
    return Math.max(Number(this.session.account()?.limite_diario_centavos || 0) - this.spentToday, 0);
  }

  protected submitOperation(): void {
    this.message.set('');
    this.successMessage.set('');

    if (!this.operation) {
      return;
    }

    if (this.operation.kind === 'transferencia') {
      this.router.navigate(['/index/movimientos']);
      return;
    }

    this.form.markAllAsTouched();

    const user = this.session.user();
    const account = this.session.account();

    if (!user || !account) {
      this.message.set('Vincula tu sesion en Perfil para usar esta operacion.');
      return;
    }

    if (this.form.invalid) {
      this.message.set('Completa los datos requeridos y un monto valido.');
      return;
    }

    this.isSubmitting.set(true);

    this.transactions
      .createOperation({
        usuarioId: user.id,
        cuentaId: account.id,
        tipo: this.operation.kind,
        monto: Number(this.form.controls.amount.value),
        descripcion: this.buildDescription(),
      })
      .subscribe({
        next: (response) => {
          this.session.setAccount(response.cuenta);
          this.successMessage.set(`${this.operation?.title || 'Operacion'} completada correctamente.`);
          this.form.reset();
          this.isSubmitting.set(false);
        },
        error: (error) => {
          this.message.set(this.getErrorMessage(error, 'No se pudo completar la operacion.'));
          this.isSubmitting.set(false);
        },
      });
  }

  protected refreshAccount(): void {
    this.session.refresh();
    this.successMessage.set('Datos de cuenta actualizados desde la sesion local.');
  }

  protected addCard(): void {
    this.message.set('');
    this.successMessage.set('');
    this.cardForm.markAllAsTouched();

    const user = this.session.user();
    const account = this.session.account();

    if (!user || !account) {
      this.message.set('Vincula tu sesion en Perfil para registrar tarjetas.');
      return;
    }

    if (this.cardForm.invalid) {
      this.message.set('Completa numero, fecha y CVV.');
      return;
    }

    this.isSubmitting.set(true);

    this.cardsService
      .createCard({
        usuarioId: user.id,
        cuentaId: account.id,
        numTarjeta: this.cardForm.controls.numTarjeta.value,
        fechaCaducidad: this.cardForm.controls.fechaCaducidad.value,
        cvv: this.cardForm.controls.cvv.value,
      })
      .subscribe({
        next: () => {
          this.successMessage.set('Tarjeta registrada correctamente.');
          this.cardForm.reset();
          this.isSubmitting.set(false);
          this.loadCards();
        },
        error: (error) => {
          this.message.set(this.getErrorMessage(error, 'No se pudo registrar la tarjeta.'));
          this.isSubmitting.set(false);
        },
      });
  }

  protected sendSupport(): void {
    this.message.set('');
    this.supportForm.markAllAsTouched();

    if (this.supportForm.invalid) {
      this.message.set('Completa el asunto y detalle del caso.');
      return;
    }

    this.supportSent.set(true);
    this.successMessage.set('Solicitud registrada localmente. Un asesor revisara el caso.');
    this.supportForm.reset();
  }

  protected formatMoney(centavos: number | string | null | undefined): string {
    const amount = Number(centavos || 0) / 100;

    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(amount);
  }

  private buildDescription(): string {
    const pieces = [
      this.operation?.title,
      this.form.controls.detail.value,
      this.form.controls.reference.value,
    ].filter(Boolean);

    return pieces.join(' - ');
  }

  private loadSectionData(): void {
    if (this.title === 'Tarjetas') {
      this.loadCards();
    }

    if (this.title === 'Limites') {
      this.loadMovements();
    }
  }

  private loadCards(): void {
    const user = this.session.user();

    if (!user) {
      return;
    }

    this.cardsService.getUserCards(user.id).subscribe({
      next: (response) => this.cards.set(response.tarjetas),
      error: (error) => this.message.set(this.getErrorMessage(error, 'No se pudieron cargar las tarjetas.')),
    });
  }

  private loadMovements(): void {
    const user = this.session.user();
    const account = this.session.account();

    if (!user || !account) {
      return;
    }

    this.transactions.getAccountTransactions(user.id, account.id).subscribe({
      next: (response) => this.movements.set(response.transacciones),
      error: (error) => this.message.set(this.getErrorMessage(error, 'No se pudieron cargar los limites.')),
    });
  }

  private getErrorMessage(error: { status?: number; error?: { message?: string } }, fallback: string): string {
    return error.status === 0 ? 'Backend no disponible.' : error.error?.message || fallback;
  }
}
