import crypto from 'crypto';

export const PaymentStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

export const TransactionType = {
  PAYMENT: 'payment',
  REFUND: 'refund'
};

export const generateTransactionId = () => crypto.randomUUID();

export const generateGatewayReference = () => crypto.randomBytes(16).toString('hex');

export const simulatePaymentGateway = (successRate = 0.9) => {
  return new Promise((resolve, reject) => {
    const isSuccessful = Math.random() < successRate;
    setTimeout(() => {
      if (isSuccessful) {
        resolve({ 
          gatewayReference: generateGatewayReference(),
          timestamp: new Date().toISOString()
        });
      } else {
        reject(new Error('Payment gateway declined'));
      }
    }, 1000);
  });
};

export const simulateRefundGateway = (successRate = 0.95) => {
  return new Promise((resolve, reject) => {
    const isSuccessful = Math.random() < successRate;
    setImmediate(() => {
      if (isSuccessful) {
        resolve({
          refundReference: generateGatewayReference(),
          timestamp: new Date().toISOString()
        });
      } else {
        reject(new Error('Refund gateway declined'));
      }
    });
  });
};