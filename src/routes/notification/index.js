import express from 'express';
import preferencesRouter from './preferences.js';

const router = express.Router();

// Mount preferences routes
router.use('/preferences', preferencesRouter);

export default router;