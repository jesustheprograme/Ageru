import { Routes } from '@angular/router';
import { LoginPage } from './pages/login-page/login-page';
import { IndexPage } from './pages/index-page/index-page';
import { ContactsPage } from './pages/contacts-page/contacts-page';
import { TransactionPage } from './pages/transaction-page/transaction-page';
import { InfoPage } from './pages/info-page/info-page';
import { RegisterPage } from './pages/register-page/register-page';
import { ForgotPasswordPage } from './pages/forgot-password-page/forgot-password-page';
import { ResetPasswordPage } from './pages/reset-password-page/reset-password-page';
import { Dashboard } from './pages/index-page/components/dashboard/dashboard';
import { PlaceholderPage } from './pages/placeholder-page/placeholder-page';
import { ProfilePage } from './pages/profile-page/profile-page';

/**
 * Arbol de navegacion del frontend.
 *
 * La ruta /index actua como layout privado con sidebar y rutas hijas. Las rutas
 * antiguas en ingles redirigen a las vistas actuales en espanol para mantener compatibilidad.
 */
export const routes: Routes = [
  {
    path: '',
    component: LoginPage,
  },
  {
    path: 'index',
    component: IndexPage,
    children: [
      {
        path: '',
        component: Dashboard,
      },
      {
        path: 'movimientos',
        component: TransactionPage,
      },
      {
        path: 'transferir',
        component: PlaceholderPage,
        data: { title: 'Transferir', description: 'Prepara una transferencia entre cuentas o contactos frecuentes.' },
      },
      {
        path: 'recargar',
        component: PlaceholderPage,
        data: { title: 'Recargar', description: 'Recarga saldo a tu cuenta, billetera o servicios asociados.' },
      },
      {
        path: 'retirar',
        component: PlaceholderPage,
        data: { title: 'Retirar', description: 'Gestiona retiros disponibles desde tu cuenta principal.' },
      },
      {
        path: 'pagar-servicios',
        component: PlaceholderPage,
        data: { title: 'Pagar servicios', description: 'Centraliza pagos de luz, agua, internet y otros servicios.' },
      },
      {
        path: 'contactos',
        component: ContactsPage,
      },
      {
        path: 'cuentas',
        component: PlaceholderPage,
        data: { title: 'Cuentas', description: 'Administra cuentas vinculadas, alias y moneda preferida.' },
      },
      {
        path: 'tarjetas',
        component: PlaceholderPage,
        data: { title: 'Tarjetas', description: 'Consulta tarjetas asociadas y su estado operativo.' },
      },
      {
        path: 'limites',
        component: PlaceholderPage,
        data: { title: 'Limites', description: 'Configura limites diarios para transferencias, retiros y pagos.' },
      },
      {
        path: 'notificaciones',
        component: InfoPage,
      },
      {
        path: 'seguridad',
        component: PlaceholderPage,
        data: { title: 'Seguridad', description: 'Revisa accesos, metodos de validacion y sesiones activas.' },
      },
      {
        path: 'perfil',
        component: ProfilePage,
      },
      {
        path: 'soporte',
        component: PlaceholderPage,
        data: { title: 'Soporte', description: 'Encuentra ayuda y canales de atencion para tu cuenta.' },
      },
    ],
  },
  {
    path: 'contacts',
    redirectTo: 'index/contactos',
  },
  {
    path: 'transactions',
    redirectTo: 'index/movimientos',
  },
  {
    path: 'info',
    redirectTo: 'index/notificaciones',
  },
  {
    path: 'register',
    component: RegisterPage,
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordPage,
  },
  {
    path: 'reset-password',
    component: ResetPasswordPage,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
