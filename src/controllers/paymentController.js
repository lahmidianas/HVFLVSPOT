import { PaymentService } from '../services/paymentService.js';

const paymentService = new PaymentService();

export const processPayment = async (req, res, next) => {
  try {
    const { eventId, ticketId, amount } = req.body;
    const userId = req.user.id;

    const transaction = await paymentService.processPayment({
      userId,
      eventId,
      ticketId,
      amount
    });

    res.status(201).json(transaction);
  } catch (error) {
    next(error);
  }
};

export const processRefund = async (req, res, next) => {
  try {
    const { transactionId } = req.body;
    const refund = await paymentService.processRefund(transactionId);
    res.json(refund);
  } catch (error) {
    next(error);
  }
};

export const getTransactionHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      type = 'user',
      page,
      limit,
      status,
      transactionType,
      startDate,
      endDate
    } = req.query;

    const result = await paymentService.getTransactionHistory(userId, type, {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      transactionType,
      startDate,
      endDate
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};