import { Router } from 'express';
import {
  getAccountController,
  getUserAccountController,
  listAccountsController,
} from '../controllers/account.controller.js';

const router = Router();

// Consultas de cuentas usadas por el dashboard y pruebas de integracion.
router.get('/', listAccountsController);
router.get('/usuario/:usuarioId', getUserAccountController);
router.get('/:id', getAccountController);

export default router;
