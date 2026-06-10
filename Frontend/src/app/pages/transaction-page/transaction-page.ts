import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AccountService } from '../../core/services/account.service';
import { Contact, ContactService } from '../../core/services/contact.service';
import { NotificationCenterService } from '../../core/services/notification-center.service';
import { SessionService } from '../../core/services/session.service';
import { Transaction, TransactionService } from '../../core/services/transaction.service';

@Component({
  selector: 'app-transacciones-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './transaction-page.html',
  styleUrl: './transaction-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly accounts = inject(AccountService);
  private readonly session = inject(SessionService);
  private readonly transactions = inject(TransactionService);
  private readonly contactService = inject(ContactService);
  private readonly notificationCenter = inject(NotificationCenterService);

  protected readonly user = this.session.user;
  protected readonly account = this.session.account;
  protected readonly movements = signal<Transaction[]>([]);
  protected readonly contacts = signal<Contact[]>([]);
  protected readonly isLoadingMovements = signal(false);
  protected readonly isLoadingContacts = signal(false);
  protected readonly isConfirming = signal(false);
  protected readonly message = signal('');
  protected readonly successMessage = signal('');
  protected readonly showSuccessModal = signal(false);
  protected readonly completedTransfer = signal<Transaction | null>(null);
  protected readonly selectedContact = signal<Contact | null>(null);
  protected readonly showContactsList = signal(false);
  protected readonly contactSearch = signal('');
  protected readonly filteredContacts = computed(() => {
    const query = this.contactSearch().trim().toLowerCase();

    if (!query) {
      return this.contacts();
    }

    return this.contacts().filter((contact) =>
      [
        contact.alias,
        contact.nombres,
        contact.apellidos,
        contact.email,
        contact.telefono,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  });

  protected readonly transferForm = this.fb.group({
    codigoCuentaDestino: ['', Validators.required],
    contactoId: [''],
    monto: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
    descripcion: [''],
  });

  constructor() {
    this.loadMovements();
    this.loadContacts();

    effect(() => {
      const payload = this.notificationCenter.transferRefresh();
      const account = this.account();

      if (payload && account && payload.accountIds.includes(account.id)) {
        this.refreshAccountAndMovements(true);
      }
    });
  }

  protected confirmTransfer(): void {
    this.message.set('');
    this.successMessage.set('');
    this.transferForm.markAllAsTouched();

    const user = this.user();
    const account = this.account();

    if (!user || !account) {
      this.message.set('Inicia sesion nuevamente para transferir.');
      return;
    }

    const hasDestination = Boolean(
      this.transferForm.controls.contactoId.value ||
        this.transferForm.controls.codigoCuentaDestino.value.trim(),
    );

    if (this.transferForm.controls.monto.invalid || !hasDestination) {
      this.message.set('Selecciona un contacto o ingresa un destino, y coloca un monto valido.');
      return;
    }

    this.isConfirming.set(true);

    this.transactions
      .confirm({
        usuarioId: user.id,
        cuentaOrigenId: account.id,
        codigoCuentaDestino: this.transferForm.controls.codigoCuentaDestino.value,
        contactoId: this.transferForm.controls.contactoId.value || undefined,
        monto: Number(this.transferForm.controls.monto.value),
        descripcion: this.transferForm.controls.descripcion.value,
        code: '0000',
      })
      .subscribe({
        next: (response) => {
          this.account.set(response.cuentaOrigen);
          this.session.setAccount(response.cuentaOrigen);
          this.completedTransfer.set(response.transaccion);
          this.successMessage.set('Transferencia completada correctamente.');
          this.showSuccessModal.set(true);
          this.transferForm.reset();
          this.selectedContact.set(null);
          this.isConfirming.set(false);
          this.notificationCenter.notifyTransfer([
            response.cuentaOrigen.id,
            response.cuentaDestino.id,
          ]);
          this.loadMovements(true);
        },
        error: (error) => {
          this.message.set(this.getErrorMessage(error, 'No se pudo realizar la transferencia. Revisa el saldo o el destinatario.'));
          this.isConfirming.set(false);
        },
      });
  }

  protected closeSuccessModal(): void {
    this.showSuccessModal.set(false);
  }

  protected toggleContactsList(): void {
    this.showContactsList.set(true);
  }

  protected closeContactsList(): void {
    this.showContactsList.set(false);
    this.contactSearch.set('');
  }

  protected updateContactSearch(value: string): void {
    this.contactSearch.set(value);
  }

  protected selectContact(contact: Contact): void {
    this.selectedContact.set(contact);
    this.transferForm.controls.contactoId.setValue(contact.id);
    this.transferForm.controls.codigoCuentaDestino.setValue(contact.email);
    this.closeContactsList();
  }

  protected clearSelectedContact(): void {
    this.selectedContact.set(null);
    this.transferForm.controls.contactoId.setValue('');
    this.transferForm.controls.codigoCuentaDestino.setValue('');
  }

  protected getContactFullName(contact: Contact): string {
    return `${contact.nombres} ${contact.apellidos}`.trim();
  }

  protected loadContacts(): void {
    const user = this.user();

    if (!user) {
      return;
    }

    this.isLoadingContacts.set(true);

    this.contactService.getUserContacts(user.id).subscribe({
      next: (response) => {
        this.contacts.set(response.contactos);
        this.isLoadingContacts.set(false);
      },
      error: () => {
        this.isLoadingContacts.set(false);
      },
    });
  }

  protected formatMoney(centavos: number | string | null | undefined): string {
    const amount = Number(centavos || 0) / 100;

    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(amount);
  }

  protected formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }

  protected movementTitle(movement: Transaction): string {
    if (movement.direccion === 'entrada') return 'Transferencia recibida';
    if (movement.direccion === 'salida') return 'Transferencia enviada';
    return 'Movimiento';
  }

  private refreshAccountAndMovements(silent = false): void {
    const user = this.user();

    if (!user) {
      return;
    }

    this.accounts.getUserAccount(user.id).subscribe({
      next: (response) => {
        this.account.set(response.cuenta);
        this.session.setAccount(response.cuenta);
        this.loadMovements(silent);
      },
      error: () => this.loadMovements(silent),
    });
  }

  private loadMovements(silent = false): void {
    const user = this.user();
    const account = this.account();

    if (!user || !account) {
      return;
    }

    if (!silent) {
      this.isLoadingMovements.set(true);
    }

    this.transactions.getAccountTransactions(user.id, account.id).subscribe({
      next: (response) => {
        this.movements.set(response.transacciones);
        this.isLoadingMovements.set(false);
      },
      error: (error) => {
        if (!silent) {
          this.message.set(this.getErrorMessage(error, 'No se pudieron cargar los movimientos.'));
        }

        this.isLoadingMovements.set(false);
      },
    });
  }

  private getErrorMessage(error: { status?: number; error?: { message?: string } }, fallback: string): string {
    return error.status === 0 ? 'Backend no disponible.' : error.error?.message || fallback;
  }
}
