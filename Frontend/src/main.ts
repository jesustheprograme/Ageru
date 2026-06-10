import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

/**
 * Punto de entrada del frontend Angular.
 * Arranca la aplicacion standalone usando la configuracion central de providers.
 */
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
