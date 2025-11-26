import { PaymentService } from '../services/paymentService.js';
import { PaymentStatus, TransactionType } from '../utils/paymentUtils.js';
import { setupTestData, cleanupTestData, assertSuccess, assertError, TEST_USER_ID } from './testUtils.js';
import { supabase, supabaseAdmin } from '../lib/supabase.js';

// Use admin client for test queries to bypass RLS
const testClient = supabaseAdmin || supabase;

const paymentService = new PaymentService();

// Enhanced logging utility
const logStep = (testName, step, data = null) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🧪 ${testName} - ${step}`);
  if (data) {
    console.log(`[${timestamp}] 📊 Data:`, JSON.stringify(data, null, 2));
  }
};

const logTestStart = (testName) => {
  console.log('\n' + '='.repeat(80));
  console.log(`🚀 STARTING TEST: ${testName}`);
  console.log('='.repeat(80));
};

const logTestEnd = (testName, success) => {
  const status = success ? '✅ PASSED' : '❌ FAILED';
  console.log('='.repeat(80));
  console.log(`${status}: ${testName}`);
  console.log('='.repeat(80) + '\n');
};

const logError = (testName, step, error) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ❌ ${testName} - ${step} FAILED`);
  console.log(`[${timestamp}] 🔥 Error:`, error.message);
  console.log(`[${timestamp}] 📚 Stack:`, error.stack);
};

async function testPaymentProcessing() {
  const testName = 'Payment Processing';
  logTestStart(testName);
  
  try {
    logStep(testName, 'Step 1: Preparing payment data');
    const paymentData = {
      userId: TEST_USER_ID(),
      eventId: '123e4567-e89b-12d3-a456-426614174000',
      ticketId: '123e4567-e89b-12d3-a456-426614174001',
      amount: 100.00
    };
    logStep(testName, 'Payment data prepared', paymentData);

    logStep(testName, 'Step 2: Checking initial transaction count');
    const { data: initialTransactions, error: countError } = await testClient
      .from('transactions')
      .select('id')
      .eq('user_id', paymentData.userId);
    
    if (countError) {
      logError(testName, 'Step 2', countError);
      throw countError;
    }
    
    const initialCount = initialTransactions?.length || 0;
    logStep(testName, `Initial transaction count: ${initialCount}`);

    logStep(testName, 'Step 3: Processing payment through PaymentService');
    const startTime = Date.now();
    const payment = await paymentService.processPayment(paymentData);
    const processingTime = Date.now() - startTime;
    
    logStep(testName, `Payment processed in ${processingTime}ms`, {
      paymentId: payment.id,
      status: payment.status,
      amount: payment.amount,
      type: payment.type
    });

    logStep(testName, 'Step 4: Validating payment response structure');
    if (!payment || !payment.id) {
      logError(testName, 'Step 4', new Error('Payment response missing required fields'));
      throw new Error('Payment processing failed - missing payment ID');
    }

    logStep(testName, 'Step 5: Verifying payment status');
    if (payment.status !== PaymentStatus.COMPLETED) {
      logError(testName, 'Step 5', new Error(`Expected status: ${PaymentStatus.COMPLETED}, got: ${payment.status}`));
      throw new Error('Payment processing failed - incorrect status');
    }
    logStep(testName, 'Payment status verified as COMPLETED');

    logStep(testName, 'Step 6: Verifying payment amount');
    if (payment.amount !== paymentData.amount) {
      logError(testName, 'Step 6', new Error(`Expected amount: ${paymentData.amount}, got: ${payment.amount}`));
      throw new Error('Payment processing failed - incorrect amount');
    }
    logStep(testName, `Payment amount verified: $${payment.amount}`);

    logStep(testName, 'Step 7: Checking database transaction count after payment');
    const { data: finalTransactions, error: finalCountError } = await testClient
      .from('transactions')
      .select('id')
      .eq('user_id', paymentData.userId);
    
    if (finalCountError) {
      logError(testName, 'Step 7', finalCountError);
      throw finalCountError;
    }
    
    const finalCount = finalTransactions?.length || 0;
    logStep(testName, `Final transaction count: ${finalCount} (expected: ${initialCount + 1})`);
    
    if (finalCount !== initialCount + 1) {
      logError(testName, 'Step 7', new Error(`Transaction count mismatch. Expected: ${initialCount + 1}, got: ${finalCount}`));
      throw new Error('Payment processing failed - transaction not recorded');
    }

    logStep(testName, 'Step 8: Verifying transaction in database');
    const { data: dbTransaction, error: dbError } = await testClient
      .from('transactions')
      .select('*')
      .eq('id', payment.id)
      .single();
    
    if (dbError || !dbTransaction) {
      logError(testName, 'Step 8', dbError || new Error('Transaction not found in database'));
      throw new Error('Payment processing failed - transaction not found in database');
    }
    
    logStep(testName, 'Transaction verified in database', {
      id: dbTransaction.id,
      user_id: dbTransaction.user_id,
      amount: dbTransaction.amount,
      status: dbTransaction.status,
      created_at: dbTransaction.created_at
    });

    logTestEnd(testName, true);
    return assertSuccess('Payment Processing');
  } catch (error) {
    logError(testName, 'Test execution', error);
    logTestEnd(testName, false);
    return assertError('Payment Processing', error);
  }
}

async function testFailedPayment() {
  const testName = 'Failed Payment Handling';
  logTestStart(testName);
  
  try {
    logStep(testName, 'Step 1: Preparing invalid payment data (negative amount)');
    const invalidPaymentData = {
      userId: TEST_USER_ID(),
      eventId: '123e4567-e89b-12d3-a456-426614174000',
      ticketId: '123e4567-e89b-12d3-a456-426614174001',
      amount: -100.00
    };
    logStep(testName, 'Invalid payment data prepared', invalidPaymentData);

    logStep(testName, 'Step 2: Checking initial failed transaction count');
    const { data: initialFailedTransactions, error: countError } = await testClient
      .from('transactions')
      .select('id')
      .eq('user_id', invalidPaymentData.userId)
      .eq('status', PaymentStatus.FAILED);
    
    if (countError) {
      logError(testName, 'Step 2', countError);
      throw countError;
    }
    
    const initialFailedCount = initialFailedTransactions?.length || 0;
    logStep(testName, `Initial failed transaction count: ${initialFailedCount}`);

    logStep(testName, 'Step 3: Attempting to process invalid payment');
    let paymentFailed = false;
    let errorMessage = '';
    
    try {
      const startTime = Date.now();
      await paymentService.processPayment(invalidPaymentData);
      const processingTime = Date.now() - startTime;
      logStep(testName, `Unexpected success in ${processingTime}ms - this should have failed`);
    } catch (error) {
      paymentFailed = true;
      errorMessage = error.message;
      logStep(testName, 'Payment correctly failed with error', { error: errorMessage });
    }

    logStep(testName, 'Step 4: Verifying payment failure');
    if (!paymentFailed) {
      logError(testName, 'Step 4', new Error('Payment should have failed but succeeded'));
      throw new Error('Payment should have failed');
    }

    logStep(testName, 'Step 5: Verifying error message content');
    if (!errorMessage.includes('Amount must be greater than 0')) {
      logError(testName, 'Step 5', new Error(`Expected error message about amount, got: ${errorMessage}`));
      throw new Error('Incorrect error message for failed payment');
    }
    logStep(testName, 'Error message verified correctly');

    logStep(testName, 'Step 6: Checking that no transaction was created for invalid payment');
    const { data: finalFailedTransactions, error: finalCountError } = await testClient
      .from('transactions')
      .select('id')
      .eq('user_id', invalidPaymentData.userId)
      .eq('status', PaymentStatus.FAILED);
    
    if (finalCountError) {
      logError(testName, 'Step 6', finalCountError);
      throw finalCountError;
    }
    
    const finalFailedCount = finalFailedTransactions?.length || 0;
    logStep(testName, `Final failed transaction count: ${finalFailedCount} (should equal initial: ${initialFailedCount})`);

    logTestEnd(testName, true);
    return assertSuccess('Failed Payment Handling');
  } catch (error) {
    logError(testName, 'Test execution', error);
    logTestEnd(testName, false);
    return assertError('Failed Payment Handling', error);
  }
}

async function testRefundProcessing() {
  const testName = 'Refund Processing';
  logTestStart(testName);
  
  try {
    logStep(testName, 'Step 1: Creating initial payment for refund test');
    const paymentData = {
      userId: TEST_USER_ID(),
      eventId: '123e4567-e89b-12d3-a456-426614174000',
      ticketId: '123e4567-e89b-12d3-a456-426614174001',
      amount: 100.00
    };
    logStep(testName, 'Payment data for refund test', paymentData);

    const startPaymentTime = Date.now();
    const payment = await paymentService.processPayment(paymentData);
    const paymentTime = Date.now() - startPaymentTime;
    
    logStep(testName, `Initial payment created in ${paymentTime}ms`, {
      paymentId: payment.id,
      status: payment.status,
      amount: payment.amount
    });

    logStep(testName, 'Step 2: Verifying initial payment status');
    if (payment.status !== PaymentStatus.COMPLETED) {
      logError(testName, 'Step 2', new Error(`Initial payment failed with status: ${payment.status}`));
      throw new Error('Initial payment failed - cannot test refund');
    }
    logStep(testName, 'Initial payment verified as COMPLETED');

    logStep(testName, 'Step 3: Checking initial refund transaction count');
    const { data: initialRefunds, error: refundCountError } = await testClient
      .from('transactions')
      .select('id')
      .eq('user_id', paymentData.userId)
      .eq('type', TransactionType.REFUND);
    
    if (refundCountError) {
      logError(testName, 'Step 3', refundCountError);
      throw refundCountError;
    }
    
    const initialRefundCount = initialRefunds?.length || 0;
    logStep(testName, `Initial refund count: ${initialRefundCount}`);

    logStep(testName, 'Step 4: Processing refund');
    const startRefundTime = Date.now();
    const refund = await paymentService.processRefund(payment.id);
    const refundTime = Date.now() - startRefundTime;
    
    logStep(testName, `Refund processed in ${refundTime}ms`, {
      refundId: refund.id,
      status: refund.status,
      amount: refund.amount,
      type: refund.type,
      referenceId: refund.reference_id
    });

    logStep(testName, 'Step 5: Validating refund response structure');
    if (!refund || !refund.id) {
      logError(testName, 'Step 5', new Error('Refund response missing required fields'));
      throw new Error('Refund processing failed - missing refund ID');
    }

    logStep(testName, 'Step 6: Verifying refund status');
    if (refund.status !== PaymentStatus.REFUNDED) {
      logError(testName, 'Step 6', new Error(`Expected refund status: ${PaymentStatus.REFUNDED}, got: ${refund.status}`));
      throw new Error('Refund processing failed - incorrect status');
    }
    logStep(testName, 'Refund status verified as REFUNDED');

    logStep(testName, 'Step 7: Verifying refund amount matches original payment');
    if (refund.amount !== payment.amount) {
      logError(testName, 'Step 7', new Error(`Refund amount ${refund.amount} doesn't match payment amount ${payment.amount}`));
      throw new Error('Refund processing failed - amount mismatch');
    }
    logStep(testName, `Refund amount verified: $${refund.amount}`);

    logStep(testName, 'Step 8: Verifying refund type');
    if (refund.type !== TransactionType.REFUND) {
      logError(testName, 'Step 8', new Error(`Expected type: ${TransactionType.REFUND}, got: ${refund.type}`));
      throw new Error('Refund processing failed - incorrect type');
    }
    logStep(testName, 'Refund type verified as REFUND');

    logStep(testName, 'Step 9: Verifying reference to original payment');
    if (refund.reference_id !== payment.id) {
      logError(testName, 'Step 9', new Error(`Reference ID ${refund.reference_id} doesn't match payment ID ${payment.id}`));
      throw new Error('Refund processing failed - incorrect reference');
    }
    logStep(testName, 'Reference to original payment verified');

    logStep(testName, 'Step 10: Checking final refund transaction count');
    const { data: finalRefunds, error: finalRefundCountError } = await testClient
      .from('transactions')
      .select('id')
      .eq('user_id', paymentData.userId)
      .eq('type', TransactionType.REFUND);
    
    if (finalRefundCountError) {
      logError(testName, 'Step 10', finalRefundCountError);
      throw finalRefundCountError;
    }
    
    const finalRefundCount = finalRefunds?.length || 0;
    logStep(testName, `Final refund count: ${finalRefundCount} (expected: ${initialRefundCount + 1})`);
    
    if (finalRefundCount !== initialRefundCount + 1) {
      logError(testName, 'Step 10', new Error(`Refund count mismatch. Expected: ${initialRefundCount + 1}, got: ${finalRefundCount}`));
      throw new Error('Refund processing failed - refund not recorded');
    }

    logStep(testName, 'Step 11: Verifying original payment status updated');
    const { data: updatedPayment, error: paymentCheckError } = await testClient
      .from('transactions')
      .select('status')
      .eq('id', payment.id)
      .single();
    
    if (paymentCheckError) {
      logError(testName, 'Step 11', paymentCheckError);
      throw paymentCheckError;
    }
    
    logStep(testName, `Original payment status: ${updatedPayment.status} (expected: ${PaymentStatus.REFUNDED})`);
    
    if (updatedPayment.status !== PaymentStatus.REFUNDED) {
      logError(testName, 'Step 11', new Error(`Original payment status not updated. Expected: ${PaymentStatus.REFUNDED}, got: ${updatedPayment.status}`));
      throw new Error('Refund processing failed - original payment status not updated');
    }

    logTestEnd(testName, true);
    return assertSuccess('Refund Processing');
  } catch (error) {
    logError(testName, 'Test execution', error);
    logTestEnd(testName, false);
    return assertError('Refund Processing', error);
  }
}

async function testInvalidRefund() {
  const testName = 'Invalid Refund Handling';
  logTestStart(testName);
  
  try {
    logStep(testName, 'Step 1: Preparing invalid transaction ID for refund');
    const invalidTransactionId = 'invalid-transaction-id';
    logStep(testName, `Invalid transaction ID: ${invalidTransactionId}`);

    logStep(testName, 'Step 2: Attempting to process refund with invalid ID');
    let refundFailed = false;
    let errorMessage = '';
    
    try {
      const startTime = Date.now();
      await paymentService.processRefund(invalidTransactionId);
      const processingTime = Date.now() - startTime;
      logStep(testName, `Unexpected success in ${processingTime}ms - this should have failed`);
    } catch (error) {
      refundFailed = true;
      errorMessage = error.message;
      logStep(testName, 'Refund correctly failed with error', { error: errorMessage });
    }

    logStep(testName, 'Step 3: Verifying refund failure');
    if (!refundFailed) {
      logError(testName, 'Step 3', new Error('Invalid refund should have failed but succeeded'));
      throw new Error('Invalid refund should fail');
    }

    logStep(testName, 'Step 4: Verifying error message content');
    if (!errorMessage.includes('Invalid transaction ID')) {
      logError(testName, 'Step 4', new Error(`Expected error message about invalid ID, got: ${errorMessage}`));
      throw new Error('Incorrect error message for invalid refund');
    }
    logStep(testName, 'Error message verified correctly');

    logStep(testName, 'Step 5: Testing refund of non-existent UUID');
    const nonExistentUUID = '00000000-0000-0000-0000-000000000000';
    logStep(testName, `Testing with non-existent UUID: ${nonExistentUUID}`);
    
    let uuidRefundFailed = false;
    let uuidErrorMessage = '';
    
    try {
      await paymentService.processRefund(nonExistentUUID);
    } catch (error) {
      uuidRefundFailed = true;
      uuidErrorMessage = error.message;
      logStep(testName, 'UUID refund correctly failed', { error: uuidErrorMessage });
    }

    logStep(testName, 'Step 6: Verifying UUID refund failure');
    if (!uuidRefundFailed) {
      logError(testName, 'Step 6', new Error('Non-existent UUID refund should have failed'));
      throw new Error('Non-existent UUID refund should fail');
    }

    logTestEnd(testName, true);
    return assertSuccess('Invalid Refund Handling');
  } catch (error) {
    logError(testName, 'Test execution', error);
    logTestEnd(testName, false);
    return assertError('Invalid Refund Handling', error);
  }
}

async function testTransactionHistory() {
  const testName = 'Transaction History Retrieval';
  logTestStart(testName);
  
  try {
    logStep(testName, 'Step 1: Creating test transactions for history');
    const paymentData = {
      userId: TEST_USER_ID(),
      eventId: '123e4567-e89b-12d3-a456-426614174000',
      ticketId: '123e4567-e89b-12d3-a456-426614174001',
      amount: 100.00
    };
    
    logStep(testName, 'Creating first test payment');
    const payment1 = await paymentService.processPayment(paymentData);
    logStep(testName, 'First payment created', { id: payment1.id, amount: payment1.amount });
    
    logStep(testName, 'Creating second test payment');
    const payment2 = await paymentService.processPayment({
      ...paymentData,
      amount: 150.00
    });
    logStep(testName, 'Second payment created', { id: payment2.id, amount: payment2.amount });

    logStep(testName, 'Step 2: Retrieving transaction history');
    const historyOptions = {
      page: 1,
      limit: 10
    };
    logStep(testName, 'History retrieval options', historyOptions);
    
    const startTime = Date.now();
    const history = await paymentService.getTransactionHistory(TEST_USER_ID(), 'user', historyOptions);
    const retrievalTime = Date.now() - startTime;
    
    logStep(testName, `History retrieved in ${retrievalTime}ms`);

    logStep(testName, 'Step 3: Validating history response structure');
    if (!history || !history.transactions || !history.pagination) {
      logError(testName, 'Step 3', new Error('Invalid history response structure'));
      throw new Error('Transaction history retrieval failed - invalid structure');
    }
    logStep(testName, 'History response structure validated');

    logStep(testName, 'Step 4: Verifying transaction count');
    const transactionCount = history.transactions.length;
    logStep(testName, `Found ${transactionCount} transactions`);
    
    if (transactionCount === 0) {
      logError(testName, 'Step 4', new Error('No transactions found in history'));
      throw new Error('No transactions found');
    }

    logStep(testName, 'Step 5: Validating pagination data');
    const pagination = history.pagination;
    logStep(testName, 'Pagination data', {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: pagination.totalPages
    });
    
    if (pagination.page !== 1 || pagination.limit !== 10) {
      logError(testName, 'Step 5', new Error(`Pagination mismatch. Expected page: 1, limit: 10. Got page: ${pagination.page}, limit: ${pagination.limit}`));
      throw new Error('Pagination data incorrect');
    }

    logStep(testName, 'Step 6: Validating summary data');
    const summary = history.summary;
    logStep(testName, 'Summary data', {
      total: summary.total,
      totalAmount: summary.totalAmount,
      byStatus: summary.byStatus,
      byType: summary.byType
    });
    
    if (summary.total !== transactionCount) {
      logError(testName, 'Step 6', new Error(`Summary total ${summary.total} doesn't match transaction count ${transactionCount}`));
      throw new Error('Summary data inconsistent');
    }

    logStep(testName, 'Step 7: Validating individual transaction data');
    const firstTransaction = history.transactions[0];
    logStep(testName, 'First transaction data', {
      id: firstTransaction.id,
      amount: firstTransaction.amount,
      status: firstTransaction.status,
      type: firstTransaction.type,
      created_at: firstTransaction.created_at
    });
    
    const requiredFields = ['id', 'amount', 'status', 'type', 'created_at'];
    const missingFields = requiredFields.filter(field => !firstTransaction[field]);
    
    if (missingFields.length > 0) {
      logError(testName, 'Step 7', new Error(`Missing required fields in transaction: ${missingFields.join(', ')}`));
      throw new Error('Transaction data incomplete');
    }

    logTestEnd(testName, true);
    return assertSuccess('Transaction History Retrieval');
  } catch (error) {
    logError(testName, 'Test execution', error);
    logTestEnd(testName, false);
    return assertError('Transaction History Retrieval', error);
  }
}

async function testTransactionFilters() {
  const testName = 'Transaction Filtering';
  logTestStart(testName);
  
  try {
    logStep(testName, 'Step 1: Creating diverse test transactions');
    const paymentData = {
      userId: TEST_USER_ID(),
      eventId: '123e4567-e89b-12d3-a456-426614174000',
      ticketId: '123e4567-e89b-12d3-a456-426614174001',
      amount: 100.00
    };
    
    // Create a payment
    logStep(testName, 'Creating payment for filter test');
    const payment = await paymentService.processPayment(paymentData);
    logStep(testName, 'Payment created', { id: payment.id, status: payment.status });
    
    // Create a refund
    logStep(testName, 'Creating refund for filter test');
    const refund = await paymentService.processRefund(payment.id);
    logStep(testName, 'Refund created', { id: refund.id, status: refund.status, type: refund.type });

    logStep(testName, 'Step 2: Testing status filter (COMPLETED)');
    const completedFilter = {
      status: PaymentStatus.COMPLETED,
      page: 1,
      limit: 10
    };
    logStep(testName, 'Applying COMPLETED status filter', completedFilter);
    
    const completedHistory = await paymentService.getTransactionHistory(TEST_USER_ID(), 'user', completedFilter);
    logStep(testName, `Found ${completedHistory.transactions.length} COMPLETED transactions`);

    logStep(testName, 'Step 3: Validating COMPLETED filter results');
    const invalidCompleted = completedHistory.transactions.filter(tx => tx.status !== PaymentStatus.COMPLETED);
    if (invalidCompleted.length > 0) {
      logError(testName, 'Step 3', new Error(`Found ${invalidCompleted.length} non-COMPLETED transactions in filtered results`));
      throw new Error('Status filter not applied correctly for COMPLETED');
    }
    logStep(testName, 'COMPLETED status filter validated');

    logStep(testName, 'Step 4: Testing transaction type filter (PAYMENT)');
    const paymentTypeFilter = {
      transactionType: TransactionType.PAYMENT,
      page: 1,
      limit: 10
    };
    logStep(testName, 'Applying PAYMENT type filter', paymentTypeFilter);
    
    const paymentHistory = await paymentService.getTransactionHistory(TEST_USER_ID(), 'user', paymentTypeFilter);
    logStep(testName, `Found ${paymentHistory.transactions.length} PAYMENT transactions`);

    logStep(testName, 'Step 5: Validating PAYMENT type filter results');
    const invalidPayments = paymentHistory.transactions.filter(tx => tx.type !== TransactionType.PAYMENT);
    if (invalidPayments.length > 0) {
      logError(testName, 'Step 5', new Error(`Found ${invalidPayments.length} non-PAYMENT transactions in filtered results`));
      throw new Error('Type filter not applied correctly for PAYMENT');
    }
    logStep(testName, 'PAYMENT type filter validated');

    logStep(testName, 'Step 6: Testing transaction type filter (REFUND)');
    const refundTypeFilter = {
      transactionType: TransactionType.REFUND,
      page: 1,
      limit: 10
    };
    logStep(testName, 'Applying REFUND type filter', refundTypeFilter);
    
    const refundHistory = await paymentService.getTransactionHistory(TEST_USER_ID(), 'user', refundTypeFilter);
    logStep(testName, `Found ${refundHistory.transactions.length} REFUND transactions`);

    logStep(testName, 'Step 7: Validating REFUND type filter results');
    const invalidRefunds = refundHistory.transactions.filter(tx => tx.type !== TransactionType.REFUND);
    if (invalidRefunds.length > 0) {
      logError(testName, 'Step 7', new Error(`Found ${invalidRefunds.length} non-REFUND transactions in filtered results`));
      throw new Error('Type filter not applied correctly for REFUND');
    }
    logStep(testName, 'REFUND type filter validated');

    logStep(testName, 'Step 8: Testing date range filter');
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const dateFilter = {
      startDate: yesterday.toISOString(),
      endDate: tomorrow.toISOString(),
      page: 1,
      limit: 10
    };
    logStep(testName, 'Applying date range filter', {
      startDate: dateFilter.startDate,
      endDate: dateFilter.endDate
    });
    
    const dateHistory = await paymentService.getTransactionHistory(TEST_USER_ID(), 'user', dateFilter);
    logStep(testName, `Found ${dateHistory.transactions.length} transactions in date range`);

    logStep(testName, 'Step 9: Validating date range filter results');
    const invalidDates = dateHistory.transactions.filter(tx => {
      const txDate = new Date(tx.created_at);
      return txDate < yesterday || txDate > tomorrow;
    });
    
    if (invalidDates.length > 0) {
      logError(testName, 'Step 9', new Error(`Found ${invalidDates.length} transactions outside date range`));
      throw new Error('Date filter not applied correctly');
    }
    logStep(testName, 'Date range filter validated');

    logStep(testName, 'Step 10: Testing combined filters');
    const combinedFilter = {
      status: PaymentStatus.REFUNDED,
      transactionType: TransactionType.REFUND,
      page: 1,
      limit: 10
    };
    logStep(testName, 'Applying combined filters', combinedFilter);
    
    const combinedHistory = await paymentService.getTransactionHistory(TEST_USER_ID(), 'user', combinedFilter);
    logStep(testName, `Found ${combinedHistory.transactions.length} transactions matching combined filters`);

    logStep(testName, 'Step 11: Validating combined filter results');
    const invalidCombined = combinedHistory.transactions.filter(tx => 
      tx.status !== PaymentStatus.REFUNDED || tx.type !== TransactionType.REFUND
    );
    
    if (invalidCombined.length > 0) {
      logError(testName, 'Step 11', new Error(`Found ${invalidCombined.length} transactions not matching combined filters`));
      throw new Error('Combined filters not applied correctly');
    }
    logStep(testName, 'Combined filters validated');

    logTestEnd(testName, true);
    return assertSuccess('Transaction Filtering');
  } catch (error) {
    logError(testName, 'Test execution', error);
    logTestEnd(testName, false);
    return assertError('Transaction Filtering', error);
  }
}

export async function runPaymentTests() {
  console.log('\n' + '🏦'.repeat(20));
  console.log('🏦 STARTING PAYMENT SERVICE TEST SUITE 🏦');
  console.log('🏦'.repeat(20) + '\n');

  const testStartTime = Date.now();
  let testResults = [];

  try {
    logStep('Test Suite', 'Setting up test environment');
    await setupTestData();
    logStep('Test Suite', 'Test environment setup completed');

    // Run tests sequentially with detailed logging
    logStep('Test Suite', 'Running Payment Processing Test');
    testResults.push(await testPaymentProcessing());
    
    logStep('Test Suite', 'Running Failed Payment Test');
    testResults.push(await testFailedPayment());
    
    logStep('Test Suite', 'Running Refund Processing Test');
    testResults.push(await testRefundProcessing());
    
    logStep('Test Suite', 'Running Invalid Refund Test');
    testResults.push(await testInvalidRefund());
    
    logStep('Test Suite', 'Running Transaction History Test');
    testResults.push(await testTransactionHistory());
    
    logStep('Test Suite', 'Running Transaction Filtering Test');
    testResults.push(await testTransactionFilters());

  } finally {
    logStep('Test Suite', 'Cleaning up test environment');
    await cleanupTestData();
    logStep('Test Suite', 'Test environment cleanup completed');
  }

  const testEndTime = Date.now();
  const totalTestTime = testEndTime - testStartTime;
  
  // Calculate results
  const passedTests = testResults.filter(result => result).length;
  const totalTests = testResults.length;
  const failedTests = totalTests - passedTests;
  
  // Final summary
  console.log('\n' + '📊'.repeat(20));
  console.log('📊 PAYMENT TEST SUITE SUMMARY 📊');
  console.log('📊'.repeat(20));
  console.log(`⏱️  Total execution time: ${totalTestTime}ms`);
  console.log(`✅ Tests passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Tests failed: ${failedTests}/${totalTests}`);
  console.log(`📈 Success rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`);
  console.log('📊'.repeat(20) + '\n');

  if (failedTests > 0) {
    console.log('❌ Some tests failed. Please review the detailed logs above.');
  } else {
    console.log('🎉 All payment tests passed successfully!');
  }
}