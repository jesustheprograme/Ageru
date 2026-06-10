import { Router } from 'express';
import {
  createContactController,
  deleteContactController,
  listUserContactsController,
} from '../controllers/contact.controller.js';

const router = Router();

router.get('/usuario/:usuarioId', listUserContactsController);
router.post('/', createContactController);
router.delete('/:id', deleteContactController);

export default router;
