import express from 'express';
import { body } from 'express-validator';
import { systemLogin } from '../controllers/systemAuth.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

router.post(
  '/system/login',
  [
    body('apiKey').notEmpty(),
    validateRequest
  ],
  systemLogin
);

export default router;