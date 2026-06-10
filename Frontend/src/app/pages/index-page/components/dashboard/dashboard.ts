import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Account, AccountService } from '../../../../core/services/account.service';
import { NotificationCenterService } from '../../../../core/services/notification-center.service';
import { SessionService } from '../../../../core/services/session.service';
import { Transaction, TransactionService } from '../../../../core/services/transaction.service';

interface ActivityPoint {
  key: string;
  label: string;
  income: number;
  outcome: number;
  total: number;
  net: number;
  x: number;
  barY: number;
  barHeight: number;
  valueY: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Vista resumen del dashboard.
 * El contenido se mantiene principalmente declarativo en su plantilla.
 */
export class Dashboard {
  private readonly accounts = inject(AccountService);
  private readonly notificationCenter = inject(NotificationCenterService);
  private readonly session = inject(SessionService);
  private readonly transactions = inject(TransactionService);

  protected readonly user = this.session.user;
  protected readonly account = this.session.account;
  protected readonly movements = signal<Transaction[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly message = signal('');

  protected readonly recentMovements = computed(() => this.movements().slice(0, 3));
  protected readonly sentTotal = computed(() =>
    this.movements()
      .filter((movement) => movement.direccion === 'salida')
      .reduce((total, movement) => total + Number(movement.monto_centavos || 0), 0),
  );
  protected readonly receivedTotal = computed(() =>
    this.movements()
      .filter((movement) => movement.direccion === 'entrada')
      .reduce((total, movement) => total + Number(movement.monto_centavos || 0), 0),
  );
  protected readonly activityPoints = computed<ActivityPoint[]>(() => {
    const days = this.getLastSevenDays();
    const totalsByDay = new Map(days.map((day) => [day.key, { income: 0, outcome: 0 }]));

    for (const movement of this.movements()) {
      const key = this.getDateKey(new Date(movement.created_at));
      const bucket = totalsByDay.get(key);

      if (!bucket) {
        continue;
      }

      const amount = Number(movement.monto_centavos || 0);

      if (movement.direccion === 'entrada') {
        bucket.income += amount;
      } else {
        bucket.outcome += amount;
      }
    }

    const rawPoints = days.map((day) => {
      const totals = totalsByDay.get(day.key) || { income: 0, outcome: 0 };
      return {
        key: day.key,
        label: day.label,
        income: totals.income,
        outcome: totals.outcome,
        total: totals.income + totals.outcome,
        net: totals.income - totals.outcome,
      };
    });

    const values = rawPoints.flatMap((point) => [point.net, 0]);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = Math.max(maxValue - minValue, 1);
    const toY = (value: number) => 204 - ((value - minValue) / range) * (204 - 28);
    const zeroY = toY(0);

    return rawPoints.map((point, index) => {
      const x = 96 + index * ((760 - 96) / Math.max(rawPoints.length - 1, 1));
      const valueY = toY(point.net);
      const barY = Math.min(zeroY, valueY);
      const barHeight = Math.max(Math.abs(valueY - zeroY), point.net === 0 ? 2 : 6);

      return {
        ...point,
        x,
        barY,
        barHeight,
        valueY,
      };
    });
  });
  protected readonly chartLinePoints = computed(() =>
    this.activityPoints()
      .map((point) => `${point.x.toFixed(1)},${point.valueY.toFixed(1)}`)
      .join(' '),
  );
  protected readonly chartMaxLabel = computed(() => {
    const maxValue = Math.max(...this.activityPoints().map((point) => point.net), 0);
    return this.formatMoney(maxValue);
  });
  protected readonly chartMidLabel = computed(() => {
    return this.formatMoney(0);
  });
  protected readonly chartMinLabel = computed(() => {
    const minValue = Math.min(...this.activityPoints().map((point) => point.net), 0);
    return this.formatMoney(minValue);
  });
  protected readonly chartZeroY = computed(() => {
    const values = this.activityPoints().flatMap((point) => [point.net, 0]);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = Math.max(maxValue - minValue, 1);

    return 204 - ((0 - minValue) / range) * (204 - 28);
  });
  protected readonly chartTotal = computed(() =>
    this.activityPoints().reduce((total, point) => total + point.total, 0),
  );
  protected readonly chartNetTotal = computed(() =>
    this.activityPoints().reduce((total, point) => total + point.net, 0),
  );
  protected readonly activeDays = computed(() =>
    this.activityPoints().filter((point) => point.total > 0).length,
  );
  protected readonly peakDay = computed(() => {
    const peak = this.activityPoints().reduce<ActivityPoint | null>(
      (currentPeak, point) => (!currentPeak || point.total > currentPeak.total ? point : currentPeak),
      null,
    );

    return peak && peak.total > 0 ? peak.label : 'Sin actividad';
  });

  constructor() {
    this.loadOwnData();
    effect(() => {
      const payload = this.notificationCenter.transferRefresh();
      const account = this.account();

      if (!payload || !account || !payload.accountIds.includes(account.id)) {
        return;
      }

      this.loadOwnData(true);
    });
  }

  protected get fullName(): string {
    const user = this.user();

    if (!user) {
      return 'Usuario';
    }

    return `${user.nombres} ${user.apellidos}`.trim();
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
    return movement.direccion === 'entrada' ? 'Transferencia recibida' : 'Transferencia enviada';
  }

  protected chartPointLabel(point: ActivityPoint): string {
    return `${point.label}: neto ${this.formatMoney(point.net)}`;
  }

  private loadOwnData(silent = false): void {
    const user = this.user();

    if (!user) {
      this.message.set('Inicia sesion para ver tus datos.');
      return;
    }

    if (!silent) {
      this.isLoading.set(true);
    }

    const loadMovements = (account: Account | null): void => {
      if (!account) {
        this.isLoading.set(false);
        return;
      }

      this.transactions.getAccountTransactions(user.id, account.id).subscribe({
        next: (response) => {
          this.movements.set(response.transacciones);
          this.isLoading.set(false);
        },
        error: () => {
          if (!silent) {
            this.message.set('No se pudieron cargar tus movimientos.');
          }
          this.isLoading.set(false);
        },
      });
    };

    this.accounts.getUserAccount(user.id).subscribe({
      next: (response) => {
        this.account.set(response.cuenta);
        this.session.setAccount(response.cuenta);
        loadMovements(response.cuenta);
      },
      error: () => {
        if (!silent) {
          this.message.set('No se pudo actualizar la cuenta.');
        }
        loadMovements(this.account());
      },
    });
  }

  private getLastSevenDays(): Array<{ key: string; label: string }> {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));

      return {
        key: this.getDateKey(date),
        label: new Intl.DateTimeFormat('es-PE', {
          weekday: 'short',
        }).format(date),
      };
    });
  }

  private getDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
