import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Contact, ContactService } from '../../core/services/contact.service';
import { SessionService } from '../../core/services/session.service';

@Component({
  selector: 'app-contactos-page',
  imports: [ReactiveFormsModule],
  templateUrl: './contacts-page.html',
  styleUrl: './contacts-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Pagina de contactos frecuentes conectada a SQL Server.
 */
export class ContactsPage {
  private readonly contacts = inject(ContactService);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly session = inject(SessionService);

  protected readonly items = signal<Contact[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly isDeletingId = signal<string | null>(null);
  protected readonly message = signal('');
  protected readonly successMessage = signal('');
  protected readonly showDeleteConfirm = signal<string | null>(null);

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    alias: [''],
    esFavorito: [false],
  });

  constructor() {
    this.loadContacts();
  }

  protected loadContacts(): void {
    const user = this.session.user();

    if (!user) {
      this.message.set('Vincula tu sesion en Perfil para ver contactos.');
      return;
    }

    this.isLoading.set(true);

    this.contacts.getUserContacts(user.id).subscribe({
      next: (response) => {
        this.items.set(response.contactos);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.message.set(this.getErrorMessage(error, 'No se pudieron cargar los contactos.'));
        this.isLoading.set(false);
      },
    });
  }

  protected addContact(): void {
    this.message.set('');
    this.successMessage.set('');
    this.form.markAllAsTouched();

    const user = this.session.user();

    if (!user) {
      this.message.set('Vincula tu sesion en Perfil para agregar contactos.');
      return;
    }

    if (this.form.invalid) {
      this.message.set('Ingresa un correo valido.');
      return;
    }

    this.isSaving.set(true);

    this.contacts
      .createContact({
        usuarioId: user.id,
        email: this.form.controls.email.value,
        alias: this.form.controls.alias.value,
        esFavorito: this.form.controls.esFavorito.value,
      })
      .subscribe({
        next: () => {
          this.successMessage.set('Contacto agregado correctamente.');
          this.form.reset();
          this.isSaving.set(false);
          this.loadContacts();
        },
        error: (error) => {
          this.message.set(this.getErrorMessage(error, 'No se pudo agregar el contacto.'));
          this.isSaving.set(false);
        },
      });
  }

  protected deleteContact(contact: Contact): void {
    this.showDeleteConfirm.set(contact.id);
  }

  protected confirmDelete(contact: Contact): void {
    const user = this.session.user();

    if (!user) {
      return;
    }

    this.isDeletingId.set(contact.id);

    this.contacts.deleteContact(contact.id, user.id).subscribe({
      next: () => {
        this.successMessage.set('Contacto eliminado.');
        this.showDeleteConfirm.set(null);
        this.isDeletingId.set(null);
        this.loadContacts();
      },
      error: (error) => {
        this.message.set(this.getErrorMessage(error, 'No se pudo eliminar el contacto.'));
        this.isDeletingId.set(null);
      },
    });
  }

  protected cancelDelete(): void {
    this.showDeleteConfirm.set(null);
  }

  protected fullName(contact: Contact): string {
    return `${contact.nombres} ${contact.apellidos}`.trim();
  }

  private getErrorMessage(error: { status?: number; error?: { message?: string } }, fallback: string): string {
    return error.status === 0 ? 'Backend no disponible.' : error.error?.message || fallback;
  }
}
