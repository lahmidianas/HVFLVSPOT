import express from 'express';
import { verifySupabaseToken } from '../middleware/supabaseAuth.js';
import {
  validatePaymentRequest,
  validateRefundRequest,
  validateHistoryRequest
} from '../middleware/paymentMiddleware.js';
import {
  processPayment,
  processRefund,
  getTransactionHistory
} from '../controllers/paymentController.js';

const router = express.Router();

router.post('/process', verifySupabaseToken, validatePaymentRequest, processPayment);
router.post('/refund', verifySupabaseToken, validateRefundRequest, processRefund);
router.get('/history', verifySupabaseToken, validateHistoryRequest, getTransactionHistory);

export default router;