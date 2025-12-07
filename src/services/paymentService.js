import { supabase, supabaseAdmin } from '../lib/server/supabaseAdmin.js';
import {
  PaymentStatus,
  TransactionType,
  generateTransactionId,
  simulatePaymentGateway,
  simulateRefundGateway
} from '../utils/paymentUtils.js';

export class PaymentService {
  async processPayment({ userId, eventId, ticketId, amount }) {
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    try {
      // Simulate payment gateway processing
      const gatewayResponse = await simulatePaymentGateway();

      // Create transaction record
      const { data: transaction, error } = await (supabaseAdmin || supabase)
        .from('transactions')
        .insert({
          id: generateTransactionId(),
          user_id: userId,
          event_id: eventId,
          ticket_id: ticketId,
          amount,
          status: PaymentStatus.COMPLETED,
          type: TransactionType.PAYMENT,
          reference_id: null
        })
        .select()
        .single();

      if (error) throw error;
      return transaction;
    } catch (error) {
      // Create failed transaction record if gateway fails
      if (error.message === 'Payment gateway declined') {
        const { data: failedTransaction } = await (supabaseAdmin || supabase)
          .from('transactions')
          .insert({
            id: generateTransactionId(),
            user_id: userId,
            event_id: eventId,
            ticket_id: ticketId,
            amount,
            status: PaymentStatus.FAILED,
            type: TransactionType.PAYMENT,
            reference_id: null
          })
          .select()
          .single();

        return failedTransaction;
      }
      throw error;
    }
  }

  async processRefund(transactionId) {
    try {
      // Verify original transaction exists and is eligible for refund
      const { data: originalTransaction, error: fetchError } = await (supabaseAdmin || supabase)
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (fetchError || !originalTransaction) {
        throw new Error('Invalid transaction ID');
      }

      if (originalTransaction.status !== PaymentStatus.COMPLETED) {
        throw new Error('Transaction is not eligible for refund');
      }

      // Simulate refund through payment gateway
      await simulateRefundGateway();

      // Create refund transaction
      const { data: refundTransaction, error: refundError } = await (supabaseAdmin || supabase)
        .from('transactions')
        .insert({
          id: generateTransactionId(),
          user_id: originalTransaction.user_id,
          event_id: originalTransaction.event_id,
          ticket_id: originalTransaction.ticket_id,
          amount: originalTransaction.amount,
          status: PaymentStatus.REFUNDED,
          type: TransactionType.REFUND,
          reference_id: originalTransaction.id
        })
        .select()
        .single();

      if (refundError) throw refundError;

      // Update original transaction status
      const { error: updateError } = await (supabaseAdmin || supabase)
        .from('transactions')
        .update({ status: PaymentStatus.REFUNDED })
        .eq('id', transactionId);

      if (updateError) throw updateError;

      return refundTransaction;
    } catch (error) {
      throw error;
    }
  }

  async getTransactionHistory(userId, type = 'user', options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        transactionType,
        startDate,
        endDate
      } = options;

      let query = (supabaseAdmin || supabase)
        .from('transactions')
        .select(`
          *,
          events (
            title,
            start_date,
            location,
            organizer_id
          ),
          tickets (
            type,
            price
          ),
          users!transactions_user_id_fkey (
            full_name,
            email
          )
        `, { count: 'exact' });

      // Apply filters based on user type
      if (type === 'user') {
        query = query.eq('user_id', userId);
      } else if (type === 'organizer') {
        query = query.in('event_id', 
          (supabaseAdmin || supabase)
            .from('events')
            .select('id')
            .eq('organizer_id', userId)
        );
      }

      // Apply status filter
      if (status) {
        query = query.eq('status', status);
      }

      // Apply transaction type filter
      if (transactionType) {
        query = query.eq('type', transactionType);
      }

      // Apply date range filters
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      // Calculate pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      // Execute query with pagination
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Process and format the results
      const formattedTransactions = data.map(tx => ({
        id: tx.id,
        amount: tx.amount,
        status: tx.status,
        type: tx.type,
        created_at: tx.created_at,
        event: tx.events ? {
          title: tx.events.title,
          date: tx.events.start_date,
          location: tx.events.location
        } : null,
        ticket: tx.tickets ? {
          type: tx.tickets.type,
          price: tx.tickets.price
        } : null,
        user: tx.users ? {
          name: tx.users.full_name,
          email: tx.users.email
        } : null
      }));

      return {
        transactions: formattedTransactions,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit)
        },
        summary: await this.getTransactionSummary(data)
      };
    } catch (error) {
      throw new Error(`Failed to fetch transaction history: ${error.message}`);
    }
  }

  async getTransactionSummary(transactions) {
    const summary = {
      total: transactions.length,
      totalAmount: 0,
      byStatus: {},
      byType: {}
    };

    transactions.forEach(tx => {
      // Sum total amount
      summary.totalAmount += Number(tx.amount);

      // Count by status
      summary.byStatus[tx.status] = (summary.byStatus[tx.status] || 0) + 1;

      // Count by type
      summary.byType[tx.type] = (summary.byType[tx.type] || 0) + 1;
    });

    return summary;
  }
}
