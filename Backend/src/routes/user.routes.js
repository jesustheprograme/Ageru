import { Router } from 'express';
import { getUserController, listUsersController } from '../controllers/user.controller.js';

const router = Router();

// Lectura de usuarios: listado general y detalle por identificador.
router.get('/', listUsersController);
router.get('/:id', getUserController);

export default router;
