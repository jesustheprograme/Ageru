import { Router } from 'express';
import {
  confirmTransactionController,
  createOperationController,
  listAccountTransactionsController,
  listUserTransactionsController,
} from '../controllers/transaction.controller.js';

const router = Router();

// Movimientos y transferencias confirmadas con OTP.
router.get('/usuario/:usuarioId/cuenta/:cuentaId', listAccountTransactionsController);
router.get('/usuario/:usuarioId', listUserTransactionsController);
router.post('/confirm', confirmTransactionController);
router.post('/operacion', createOperationController);

export default router;
