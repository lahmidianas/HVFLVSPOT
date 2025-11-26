// Simulated notification delivery functions
export const sendEmail = async (email, content) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`[EMAIL] To: ${email}, Content: ${content}`);
      resolve({ success: true });
    }, 500);
  });
};

export const sendPushNotification = async (deviceTokens, content) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`[PUSH] To: ${deviceTokens.join(', ')}, Content: ${content}`);
      resolve({ success: true });
    }, 500);
  });
};

export const sendSMS = async (phone, content) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`[SMS] To: ${phone}, Content: ${content}`);
      resolve({ success: true });
    }, 500);
  });
};

export const NotificationType = {
  BOOKING: 'booking',
  PAYMENT: 'payment',
  MARKETING: 'marketing',
  REMINDER: 'reminder'
};

export const NotificationChannel = {
  EMAIL: 'email',
  PUSH: 'push',
  SMS: 'sms'
};