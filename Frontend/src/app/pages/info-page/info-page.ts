import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { SessionService } from '../../core/services/session.service';
import { Transaction, TransactionService } from '../../core/services/transaction.service';

@Component({
  selector: 'app-info-page',
  imports: [],
  templateUrl: './info-page.html',
  styleUrl: './info-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoPage {
  private readonly session = inject(SessionService);
  private readonly transactions = inject(TransactionService);

  protected readonly movements = signal<Transaction[]>([]);
  protected readonly message = signal('');

  constructor() {
    const user = this.session.user();
    const account = this.session.account();

    if (!user || !account) {
      this.message.set('Vincula tu sesion para ver notificaciones.');
      return;
    }

    this.transactions.getAccountTransactions(user.id, account.id).subscribe({
      next: (response) => this.movements.set(response.transacciones.slice(0, 8)),
      error: () => this.message.set('No se pudieron cargar las notificaciones.'),
    });
  }

  protected title(movement: Transaction): string {
    if (movement.tipo === 'recarga') return 'Recarga completada';
    if (movement.tipo === 'retiro') return 'Retiro registrado';
    if (movement.tipo === 'pago_servicio') return 'Pago de servicio completado';
    return movement.direccion === 'entrada' ? 'Transferencia recibida' : 'Transferencia enviada';
  }
}
