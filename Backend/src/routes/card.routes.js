import { Router } from 'express';
import { createCardController, listUserCardsController } from '../controllers/card.controller.js';

const router = Router();

// Alta manual de tarjetas y consulta de tarjetas por usuario.
router.post('/', createCardController);
router.get('/usuario/:usuarioId', listUserCardsController);

export default router;
