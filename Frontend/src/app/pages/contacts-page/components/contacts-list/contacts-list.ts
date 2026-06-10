import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-contacts-list',
  imports: [],
  templateUrl: './contacts-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactsList { }
