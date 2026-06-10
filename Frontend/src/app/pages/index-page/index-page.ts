import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, OnDestroy, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { NotificationCenterService } from '../../core/services/notification-center.service';
import { SessionService } from '../../core/services/session.service';
import { Transaction, TransactionService } from '../../core/services/transaction.service';
import { Sidebar } from '../shared/components/sidebar/sidebar';

@Component({
  selector: 'app-index-page',
  imports: [Sidebar, RouterLink, RouterOutlet],
  templateUrl: './index-page.html',
  styleUrl: './index-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Layout principal autenticado.
 *
 * Aplica clases globales para el tema del dashboard, hospeda el sidebar y muestra
 * mensajes de navegacion enviados desde otras pantallas.
 */
export class IndexPage implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly notificationCenter = inject(NotificationCenterService);
  private readonly transactions = inject(TransactionService);
  protected readonly session = inject(SessionService);

  protected readonly toastMessage = signal('');
  protected readonly isDarkTheme = signal(false);
  protected readonly isNotificationsOpen = signal(false);
  protected readonly isLoadingNotifications = signal(false);
  protected readonly notificationMessage = signal('');
  protected readonly notificationMovements = signal<Transaction[]>([]);
  protected readonly recentNotifications = computed(() => this.notificationMovements().slice(0, 6));
  protected readonly notificationCount = computed(() => this.notificationMovements().length);

  constructor() {
    // La clase global permite que estilos compartidos distingan el area dashboard del login.
    this.document.body.classList.add('ageru-dashboard-page');

    const state = this.router.getCurrentNavigation()?.extras.state || window.history.state;
    const message = typeof state?.['toastMessage'] === 'string' ? state['toastMessage'] : '';

    if (message) {
      this.toastMessage.set(message);
      window.setTimeout(() => this.toastMessage.set(''), 4500);
    }

    effect(() => {
      const payload = this.notificationCenter.transferRefresh();
      const account = this.session.account();

      if (!payload || !account || !payload.accountIds.includes(account.id)) {
        return;
      }

      this.loadNotifications(true);
    });

    this.loadNotifications();
  }

  /**
   * Alterna el tema visual del dashboard aplicando una clase global al body.
   */
  protected toggleTheme(): void {
    this.isDarkTheme.update((current) => {
      const next = !current;
      this.document.body.classList.toggle('ageru-dashboard-dark', next);
      return next;
    });
  }

  protected get firstName(): string {
    return this.session.firstName;
  }

  protected toggleNotifications(): void {
    this.isNotificationsOpen.update((current) => !current);
    this.loadNotifications();
  }

  protected closeNotifications(): void {
    this.isNotificationsOpen.set(false);
  }

  protected notificationTitle(movement: Transaction): string {
    if (movement.tipo === 'recarga') return 'Recarga completada';
    if (movement.tipo === 'retiro') return 'Retiro registrado';
    if (movement.tipo === 'pago_servicio') return 'Pago de servicio completado';
    return movement.direccion === 'entrada' ? 'Transferencia recibida' : 'Transferencia enviada';
  }

  protected notificationDetail(movement: Transaction): string {
    return movement.descripcion || movement.referencia_externa || 'Movimiento registrado';
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

  private loadNotifications(silent = false): void {
    const user = this.session.user();
    const account = this.session.account();

    if (!user || !account) {
      this.notificationMovements.set([]);
      this.notificationMessage.set('Inicia sesion para ver notificaciones.');
      return;
    }

    if (!silent) {
      this.isLoadingNotifications.set(true);
    }
    this.notificationMessage.set('');

    this.transactions.getAccountTransactions(user.id, account.id).subscribe({
      next: (response) => {
        this.notificationMovements.set(response.transacciones);
        this.isLoadingNotifications.set(false);
      },
      error: () => {
        if (!silent) {
          this.notificationMessage.set('No se pudieron cargar las notificaciones.');
        }
        this.isLoadingNotifications.set(false);
      },
    });
  }

  /**
   * Restaura las clases globales al salir del layout principal.
   */
  ngOnDestroy(): void {
    this.document.body.classList.remove('ageru-dashboard-page');
    this.document.body.classList.remove('ageru-dashboard-dark');
  }

}
