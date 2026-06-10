import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
/**
 * Componente raiz.
 * Su unica responsabilidad es alojar el RouterOutlet de las paginas.
 */
export class App {
  protected readonly title = signal('ageru');
}
