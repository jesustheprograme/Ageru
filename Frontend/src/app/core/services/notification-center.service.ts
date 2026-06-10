import { Injectable, signal } from '@angular/core';

interface TransferRefreshPayload {
  accountIds: string[];
}

@Injectable({
  providedIn: 'root',
})
export class NotificationCenterService {
  private readonly channelName = 'ageru_transfer_updates';
  private readonly channel = typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel(this.channelName)
    : null;

  readonly refreshKey = signal(0);
  readonly transferRefresh = signal<TransferRefreshPayload | null>(null);

  constructor() {
    this.channel?.addEventListener('message', (event: MessageEvent<TransferRefreshPayload>) => {
      if (!event.data?.accountIds?.length) {
        return;
      }

      this.transferRefresh.set(event.data);
      this.requestRefresh();
    });
  }

  requestRefresh(): void {
    this.refreshKey.update((current) => current + 1);
  }

  notifyTransfer(accountIds: string[]): void {
    const payload = { accountIds };

    this.transferRefresh.set(payload);
    this.requestRefresh();
    this.channel?.postMessage(payload);
  }
}
