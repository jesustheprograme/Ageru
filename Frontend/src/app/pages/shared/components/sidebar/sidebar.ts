import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SessionService } from '../../../../core/services/session.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Navegacion lateral del dashboard.
 * Usa RouterLinkActive para reflejar la seccion seleccionada.
 */
export class Sidebar {
  protected readonly session = inject(SessionService);

  protected get fullName(): string {
    return this.session.fullName;
  }

  protected get initials(): string {
    return this.session.initials;
  }
}
