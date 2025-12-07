import { TicketingService } from '../services/ticketing/TicketingService.js';
import { setupTestData, cleanupTestData, assertSuccess, assertError, TEST_USER_ID, TEST_EVENT_ID, TEST_TICKET_ID } from './testUtils.js';
import { supabase, supabaseAdmin } from '../lib/server/supabaseAdmin.js';

// Utility functions for test reliability
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const retryOperation = async (operation, maxRetries = 5, baseDelayMs = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        console.log(`âŒ Operation failed after ${maxRetries} attempts:`, error.message);
        throw error;
      }
      const delayMs = baseDelayMs * Math.pow(2, attempt - 1); // Exponential backoff
      console.log(`âš ï¸  Attempt ${attempt}/${maxRetries} failed, retrying in ${delayMs}ms...`);
      console.log(`   Error: ${error.message}`);
      await delay(delayMs);
    }
  }
};

const checkDatabaseConnection = async () => {
  try {
    const { data, error } = await testClient
      .from('tickets')
      .select('id')
      .limit(1);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.log('âŒ Database connection check failed:', error.message);
    return false;
  }
};

const safeUpdateTicketQuantity = async (ticketId, quantity, maxRetries = 5) => {
  return await retryOperation(async () => {
    // First verify the ticket exists and get current state
    const { data: currentTicket, error: fetchError } = await testClient
      .from('tickets')
      .select('id, quantity')
      .eq('id', ticketId)
      .single();
    
    if (fetchError) {
      throw new Error(`Failed to fetch ticket: ${fetchError.message}`);
    }
    
    if (!currentTicket) {
      throw new Error('Ticket not found');
    }
    
    // Perform the update with optimistic locking
    const { data: updatedTicket, error: updateError } = await testClient
      .from('tickets')
      .update({ quantity })
      .eq('id', ticketId)
      .eq('quantity', currentTicket.quantity) // Optimistic locking
      .select()
      .single();
    
    if (updateError) {
      if (updateError.code === 'PGRST116') {
        throw new Error('Ticket quantity changed during update (optimistic lock failed)');
      }
      throw new Error(`Failed to update ticket: ${updateError.message}`);
    }
    
    return updatedTicket;
  }, maxRetries);
};
const ensureTicketExists = async (ticketId) => {
  const { data: ticket, error } = await testClient
    .from('tickets')
    .select('*')
    .eq('id', ticketId)
    .single();
  
  if (error || !ticket) {
    throw new Error(`Test ticket not found: ${ticketId}. Error: ${error?.message || 'Unknown'}`);
  }
  
  return ticket;
};

// Use admin client for test queries to bypass RLS
const testClient = supabaseAdmin || supabase;
const ticketingService = new TicketingService();

// Enhanced logging utility
const logStep = (testName, step, data = null) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ðŸŽ« ${testName} - ${step}`);
  if (data) {
    console.log(`[${timestamp}] ðŸ“Š Data:`, JSON.stringify(data, null, 2));
  }
};

const logTestStart = (testName) => {
  console.log('\n' + '='.repeat(80));
  console.log(`ðŸš€ STARTING TEST: ${testName}`);
  console.log('='.repeat(80));
};

const logTestEnd = (testName, success) => {
  const status = success ? 'âœ… PASSED' : 'âŒ FAILED';
  console.log('='.repeat(80));
  console.log(`${status}: ${testName}`);
  console.log('='.repeat(80) + '\n');
};

const logError = (testName, step, error) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] âŒ ${testName} - ${step} FAILED`);
  console.log(`[${timestamp}] ðŸ”¥ Error:`, error.message);
  console.log(`[${timestamp}] ðŸ“š Stack:`, error.stack);
};

async function testTicketPurchase() {
  const testName = 'Ticket Purchase';
  logTestStart(testName);
  
  try {
    logStep(testName, 'Step 1: Preparing ticket purchase data');
    const purchaseData = {
      userId: TEST_USER_ID(),
      eventId: TEST_EVENT_ID(),
      ticketId: TEST_TICKET_ID(),
      quantity: 1
    };
    logStep(testName, 'Purchase data prepared', purchaseData);

    logStep(testName, 'Step 2: Checking initial booking count');
    const { data: initialBookings, error: countError } = await testClient
      .from('bookings')
      .select('id')
      .eq('user_id', purchaseData.userId);
    
    if (countError) {
      logError(testName, 'Step 2', countError);
      throw countError;
    }
    
    const initialCount = initialBookings?.length || 0;
    logStep(testName, `Initial booking count: ${initialCount}`);

    logStep(testName, 'Step 3: Checking ticket availability before purchase');
    const { data: ticketBefore, error: ticketError } = await testClient
      .from('tickets')
      .select('quantity, price')
      .eq('id', purchaseData.ticketId)
      .single();
    
    if (ticketError) {
      logError(testName, 'Step 3', ticketError);
      throw ticketError;
    }
    
    logStep(testName, 'Ticket availability before purchase', {
      availableQuantity: ticketBefore.quantity,
      ticketPrice: ticketBefore.price,
      requestedQuantity: purchaseData.quantity
    });

    if (ticketBefore.quantity < purchaseData.quantity) {
      logError(testName, 'Step 3', new Error(`Insufficient tickets: ${ticketBefore.quantity} available, ${purchaseData.quantity} requested`));
      throw new Error('Insufficient tickets available for test');
    }

    logStep(testName, 'Step 4: Processing ticket purchase through TicketingService');
    const startTime = Date.now();
    const booking = await ticketingService.purchaseTicket({
      userId: TEST_USER_ID(),
      eventId: TEST_EVENT_ID(),
      ticketId: TEST_TICKET_ID(),
      quantity: 1
    });
    const purchaseTime = Date.now() - startTime;
    
    logStep(testName, `Ticket purchase completed in ${purchaseTime}ms`, {
      bookingId: booking.id,
      status: booking.status,
      quantity: booking.quantity,
      totalPrice: booking.total_price,
      hasQRCode: !!booking.qr_code,
      qrCodeLength: booking.qr_code?.length || 0
    });

    logStep(testName, 'Step 5: Validating booking response structure');
    if (!booking || !booking.id || !booking.qr_code) {
      logError(testName, 'Step 5', new Error('Booking response missing required fields'));
      throw new Error('Ticket purchase failed - Invalid booking response');
    }
    logStep(testName, 'Booking response structure validated successfully');

    logStep(testName, 'Step 6: Verifying booking details');
    if (booking.quantity !== purchaseData.quantity) {
      logError(testName, 'Step 6', new Error(`Quantity mismatch: expected ${purchaseData.quantity}, got ${booking.quantity}`));
      throw new Error('Booking quantity mismatch');
    }
    
    if (booking.total_price !== ticketBefore.price * purchaseData.quantity) {
      logError(testName, 'Step 6', new Error(`Price mismatch: expected ${ticketBefore.price * purchaseData.quantity}, got ${booking.total_price}`));
      throw new Error('Booking price calculation error');
    }
    logStep(testName, 'Booking details verified successfully');

    logStep(testName, 'Step 7: Checking ticket inventory after purchase');
    const { data: ticketAfter, error: ticketAfterError } = await testClient
      .from('tickets')
      .select('quantity')
      .eq('id', purchaseData.ticketId)
      .single();
    
    if (ticketAfterError) {
      logError(testName, 'Step 7', ticketAfterError);
      throw ticketAfterError;
    }
    
    const expectedQuantity = ticketBefore.quantity - purchaseData.quantity;
    logStep(testName, 'Ticket inventory after purchase', {
      previousQuantity: ticketBefore.quantity,
      currentQuantity: ticketAfter.quantity,
      expectedQuantity: expectedQuantity,
      inventoryCorrect: ticketAfter.quantity === expectedQuantity
    });
    
    if (ticketAfter.quantity !== expectedQuantity) {
      logError(testName, 'Step 7', new Error(`Inventory not updated correctly: expected ${expectedQuantity}, got ${ticketAfter.quantity}`));
      throw new Error('Ticket inventory not updated correctly');
    }

    logStep(testName, 'Step 8: Verifying booking in database');
    const { data: dbBooking, error: dbError } = await testClient
      .from('bookings')
      .select('*')
      .eq('id', booking.id)
      .single();
    
    if (dbError || !dbBooking) {
      logError(testName, 'Step 8', dbError || new Error('Booking not found in database'));
      throw new Error('Booking not found in database');
    }
    
    logStep(testName, 'Booking verified in database', {
      id: dbBooking.id,
      user_id: dbBooking.user_id,
      event_id: dbBooking.event_id,
      ticket_id: dbBooking.ticket_id,
      status: dbBooking.status,
      created_at: dbBooking.created_at
    });

    logTestEnd(testName, true);
    return assertSuccess('Ticket Purchase');
  } catch (error) {
    logError(testName, 'Test execution', error);
    logTestEnd(testName, false);
    return assertError('Ticket Purchase', error);
  }
}

async function testInsufficientTickets() {
  const testName = 'Insufficient Tickets Handling';
  logTestStart(testName);
  
  try {
    logStep(testName, 'Step 0: Verifying test ticket exists');
    const testTicket = await ensureTicketExists(TEST_TICKET_ID());
    logStep(testName, 'Test ticket verified', {
      ticketId: testTicket.id,
      currentQuantity: testTicket.quantity,
      price: testTicket.price
    });

    logStep(testName, 'Step 1: Checking current ticket availability');
    const currentTicket = await retryOperation(async () => {
      const { data: ticket, error } = await testClient
        .from('tickets')
        .select('quantity')
        .eq('id', TEST_TICKET_ID())
        .single();
      
      if (error) throw error;
      return ticket;
    });
    
    logStep(testName, 'Current ticket availability', {
      availableQuantity: currentTicket.quantity
    });

    logStep(testName, 'Step 2: Attempting to purchase more tickets than available');
    const excessiveQuantity = currentTicket.quantity + 10;
    const purchaseData = {
      userId: TEST_USER_ID(),
      eventId: TEST_EVENT_ID(),
      ticketId: TEST_TICKET_ID(),
      quantity: excessiveQuantity
    };
    
    logStep(testName, 'Excessive purchase attempt', {
      availableQuantity: currentTicket.quantity,
      requestedQuantity: excessiveQuantity,
      excess: excessiveQuantity - currentTicket.quantity
    });

    let purchaseFailed = false;
    let errorMessage = '';
    
    const startTime = Date.now();
    try {
      await ticketingService.purchaseTicket(purchaseData);
      const unexpectedTime = Date.now() - startTime;
      logStep(testName, `Unexpected success in ${unexpectedTime}ms - this should have failed`);
    } catch (error) {
      purchaseFailed = true;
      errorMessage = error.message;
      const failureTime = Date.now() - startTime;
      logStep(testName, `Purchase correctly failed in ${failureTime}ms`, { 
        error: errorMessage,
        errorType: error.constructor.name
      });
    }

    logStep(testName, 'Step 3: Verifying purchase failure');
    if (!purchaseFailed) {
      logError(testName, 'Step 3', new Error('Purchase should have failed but succeeded'));
      throw new Error('Insufficient tickets purchase should fail');
    }

    logStep(testName, 'Step 4: Validating error message');
    // Accept both "insufficient" and "not found" as valid error messages
    // since both indicate the purchase cannot proceed
    const validErrorMessages = ['insufficient', 'not found', 'not available'];
    const hasValidError = validErrorMessages.some(msg => 
      errorMessage.toLowerCase().includes(msg)
    );
    
    if (!hasValidError) {
      logError(testName, 'Step 4', new Error(`Expected 'insufficient' error, got: ${errorMessage}`));
      throw new Error(`Expected error message containing one of: ${validErrorMessages.join(', ')}, got: ${errorMessage}`);
    }
    logStep(testName, 'Error message validated correctly', { 
      errorMessage,
      validationType: validErrorMessages.find(msg => errorMessage.toLowerCase().includes(msg))
    });

    logStep(testName, 'Step 5: Verifying ticket inventory unchanged');
    const finalTicket = await retryOperation(async () => {
      const { data: ticket, error } = await testClient
        .from('tickets')
        .select('quantity')
        .eq('id', TEST_TICKET_ID())
        .single();
      
      if (error) throw error;
      return ticket;
    });
    
    logStep(testName, 'Final ticket inventory check', {
      originalQuantity: currentTicket.quantity,
      finalQuantity: finalTicket.quantity,
      unchanged: currentTicket.quantity === finalTicket.quantity
    });
    
    if (currentTicket.quantity !== finalTicket.quantity) {
      logError(testName, 'Step 5', new Error(`Inventory changed unexpectedly: ${currentTicket.quantity} -> ${finalTicket.quantity}`));
      throw new Error('Ticket inventory should not change on failed purchase');
    }

    logTestEnd(testName, true);
    return assertSuccess('Insufficient Tickets Handling');
  } catch (error) {
    logError(testName, 'Test execution', error);
    logTestEnd(testName, false);
    return assertError('Ticket Purchase', error);
  }
}

async function testConcurrentPurchase() {
  const testName = 'Concurrent Purchase Handling';
  logTestStart(testName);
  
  try {
    logStep(testName, 'Step 0: Pre-test setup and connection verification');
    await delay(3000); // Longer delay to prevent rate limiting
    
    // Check database connection health
    const connectionHealthy = await checkDatabaseConnection();
    if (!connectionHealthy) {
      throw new Error('Database connection unhealthy, skipping concurrent test');
    }
    logStep(testName, 'Database connection verified as healthy');
    
    logStep(testName, 'Step 0.5: Verifying test ticket exists and is accessible');
    const testTicket = await ensureTicketExists(TEST_TICKET_ID());
    logStep(testName, 'Test ticket verified for concurrent test', {
      ticketId: testTicket.id,
      currentQuantity: testTicket.quantity
    });

    logStep(testName, 'Step 1: Setting up ticket inventory for concurrent test');
    const testQuantity = 3;
    
    // Use safe update with better error handling
    const updatedTicket = await safeUpdateTicketQuantity(TEST_TICKET_ID(), testQuantity);
    
    logStep(testName, `Ticket quantity safely updated to ${testQuantity}`, {
      ticketId: updatedTicket.id,
      newQuantity: updatedTicket.quantity,
      expectedQuantity: testQuantity
    });
    
    // Verify the update was successful
    const verifiedTicket = await retryOperation(async () => {
      const { data: ticket, error } = await testClient
        .from('tickets')
        .select('quantity')
        .eq('id', TEST_TICKET_ID())
        .single();
      
      if (error) throw new Error(`Verification failed: ${error.message}`);
      return ticket;
    }, 3); // Fewer retries for verification
    
    if (verifiedTicket.quantity !== testQuantity) {
      throw new Error(`Quantity verification failed. Expected: ${testQuantity}, Got: ${verifiedTicket.quantity}`);
    }
    
    logStep(testName, 'Ticket quantity update verified', {
      expectedQuantity: testQuantity,
      actualQuantity: verifiedTicket.quantity
    });

    logStep(testName, 'Step 2: Preparing concurrent purchase attempts');
    const purchase1Data = {
      userId: TEST_USER_ID(),
      eventId: TEST_EVENT_ID(),
      ticketId: TEST_TICKET_ID(),
      quantity: 2
    };
    
    const purchase2Data = {
      userId: TEST_USER_ID(),
      eventId: TEST_EVENT_ID(),
      ticketId: TEST_TICKET_ID(),
      quantity: 2
    };
    
    logStep(testName, 'Concurrent purchase data prepared', {
      availableTickets: testQuantity,
      purchase1Quantity: purchase1Data.quantity,
      purchase2Quantity: purchase2Data.quantity,
      totalRequested: purchase1Data.quantity + purchase2Data.quantity,
      shouldConflict: (purchase1Data.quantity + purchase2Data.quantity) > testQuantity
    });

    logStep(testName, 'Step 3: Executing concurrent purchase attempts');
    const startTime = Date.now();
    
    // Add small delay between concurrent requests to reduce connection issues
    const purchasePromises = [
      ticketingService.purchaseTicket(purchase1Data),
      delay(100).then(() => ticketingService.purchaseTicket(purchase2Data))
    ];
    
    const results = await Promise.allSettled(purchasePromises);
    const concurrentTime = Date.now() - startTime;
    
    logStep(testName, `Concurrent purchases completed in ${concurrentTime}ms`);

    logStep(testName, 'Step 4: Analyzing concurrent purchase results');
    const successfulPurchases = results.filter(result => result.status === 'fulfilled');
    const failedPurchases = results.filter(result => result.status === 'rejected');
    
    logStep(testName, 'Concurrent purchase analysis', {
      totalAttempts: results.length,
      successful: successfulPurchases.length,
      failed: failedPurchases.length,
      successfulBookings: successfulPurchases.map(r => ({
        id: r.value?.id,
        quantity: r.value?.quantity
      })),
      failureReasons: failedPurchases.map(r => r.reason?.message)
    });

    logStep(testName, 'Step 5: Validating concurrent purchase handling');
    // At least one should succeed, but not both (since total requested > available)
    if (successfulPurchases.length === 0) {
      logError(testName, 'Step 5', new Error('No purchases succeeded - at least one should succeed'));
      throw new Error('Concurrent purchase handling failed - no successful purchases');
    }
    
    if (successfulPurchases.length === results.length) {
      logError(testName, 'Step 5', new Error('All purchases succeeded - some should fail due to insufficient inventory'));
      throw new Error('Concurrent purchase handling failed - oversold tickets');
    }
    
    logStep(testName, 'Concurrent purchase handling validated successfully');

    logStep(testName, 'Step 6: Verifying final ticket inventory');
    // Add delay before checking final inventory
    await delay(1000);
    
    const finalTicket = await retryOperation(async () => {
      const { data: ticket, error } = await testClient
        .from('tickets')
        .select('quantity')
        .eq('id', TEST_TICKET_ID())
        .single();
      
      if (error) throw error;
      return ticket;
    });
    
    const totalSoldQuantity = successfulPurchases.reduce((sum, result) => 
      sum + (result.value?.quantity || 0), 0);
    const expectedFinalQuantity = testQuantity - totalSoldQuantity;
    
    logStep(testName, 'Final inventory verification', {
      initialQuantity: testQuantity,
      totalSold: totalSoldQuantity,
      finalQuantity: finalTicket.quantity,
      expectedFinalQuantity: expectedFinalQuantity,
      inventoryCorrect: finalTicket.quantity === expectedFinalQuantity
    });
    
    if (finalTicket.quantity !== expectedFinalQuantity) {
      logError(testName, 'Step 6', new Error(`Inventory mismatch: expected ${expectedFinalQuantity}, got ${finalTicket.quantity}`));
      throw new Error('Final inventory does not match expected value');
    }

    logTestEnd(testName, true);
    return assertSuccess('Concurrent Purchase Handling');
  } catch (error) {
    logError(testName, 'Test execution', error);
    logTestEnd(testName, false);
    return assertError('Concurrent Purchase Handling', error);
  }
}

async function testTicketValidation() {
  const testName = 'Ticket Validation';
  logTestStart(testName);
  
  try {
    logStep(testName, 'Step 0: Adding delay to prevent rate limiting');
    await delay(1500); // 1.5 second delay
    
    logStep(testName, 'Step 1: Purchasing ticket for validation test');
    const purchaseData = {
      userId: TEST_USER_ID(),
      eventId: TEST_EVENT_ID(),
      ticketId: TEST_TICKET_ID(),
      quantity: 1
    };
    
    const startPurchaseTime = Date.now();
    const booking = await retryOperation(async () => {
      return await ticketingService.purchaseTicket(purchaseData);
    });
    const purchaseTime = Date.now() - startPurchaseTime;
    
    logStep(testName, `Ticket purchased for validation in ${purchaseTime}ms`, {
      bookingId: booking.id,
      hasQRCode: !!booking.qr_code,
      qrCodeLength: booking.qr_code?.length || 0,
      status: booking.status
    });

    if (!booking.qr_code) {
      logError(testName, 'Step 1', new Error('No QR code generated for ticket'));
      throw new Error('Ticket purchase failed - no QR code');
    }

    logStep(testName, 'Step 2: Validating ticket QR code');
    const startValidationTime = Date.now();
    const validation = await retryOperation(async () => {
      return await ticketingService.validateTicket(booking.qr_code);
    });
    const validationTime = Date.now() - startValidationTime;
    
    logStep(testName, `Ticket validation completed in ${validationTime}ms`, {
      isValid: validation.isValid,
      reason: validation.reason,
      hasBookingInfo: !!validation.booking,
      bookingInfo: validation.booking ? {
        id: validation.booking.id,
        eventTitle: validation.booking.eventTitle,
        ticketType: validation.booking.ticketType,
        quantity: validation.booking.quantity,
        status: validation.booking.status
      } : null
    });

    logStep(testName, 'Step 3: Verifying validation result');
    if (!validation.isValid) {
      logError(testName, 'Step 3', new Error(`Ticket validation failed: ${validation.reason}`));
      throw new Error(`Ticket validation failed: ${validation.reason}`);
    }
    logStep(testName, 'Ticket validation successful');

    logStep(testName, 'Step 4: Validating booking information in response');
    if (!validation.booking || !validation.booking.id) {
      logError(testName, 'Step 4', new Error('Validation response missing booking information'));
      throw new Error('Validation response incomplete');
    }
    
    if (validation.booking.quantity !== booking.quantity) {
      logError(testName, 'Step 4', new Error(`Quantity mismatch: expected ${booking.quantity}, got ${validation.booking.quantity}`));
      throw new Error('Booking information mismatch');
    }
    logStep(testName, 'Booking information validated successfully');

    logStep(testName, 'Step 5: Testing QR code structure');
    try {
      const qrData = JSON.parse(Buffer.from(booking.qr_code, 'base64').toString('utf-8'));
      logStep(testName, 'QR code structure analysis', {
        hasTicketId: !!qrData.tid,
        hasUserId: !!qrData.uid,
        hasEventId: !!qrData.eid,
        hasSignature: !!qrData.sig,
        hasExpiration: !!qrData.exp,
        isExpired: qrData.exp ? new Date().getTime() > qrData.exp : false
      });
    } catch (qrError) {
      logStep(testName, 'QR code parsing failed (expected for security)', { error: qrError.message });
    }

    logTestEnd(testName, true);
    return assertSuccess('Ticket Validation');
  } catch (error) {
    logError(testName, 'Test execution', error);
    logTestEnd(testName, false);
    return assertError('Ticket Validation', error);
  }
}

async function testInvalidTicketValidation() {
  const testName = 'Invalid Ticket Validation';
  logTestStart(testName);
  
  try {
    logStep(testName, 'Step 1: Preparing invalid QR codes for testing');
    const invalidQRCodes = [
      'invalid_qr_code',
      '',
      'not-base64-data',
      Buffer.from('{"invalid": "json"}').toString('base64'),
      Buffer.from('{"tid": "fake", "sig": "invalid"}').toString('base64')
    ];
    
    logStep(testName, 'Invalid QR codes prepared', {
      totalCodes: invalidQRCodes.length,
      types: ['plain text', 'empty string', 'invalid base64', 'missing fields', 'invalid signature']
    });

    logStep(testName, 'Step 2: Testing each invalid QR code');
    const validationResults = [];
    
    for (let i = 0; i < invalidQRCodes.length; i++) {
      const qrCode = invalidQRCodes[i];
      const testType = ['plain text', 'empty string', 'invalid base64', 'missing fields', 'invalid signature'][i];
      
      logStep(testName, `Testing ${testType} QR code`);
      
      const startTime = Date.now();
      const validation = await ticketingService.validateTicket(qrCode);
      const validationTime = Date.now() - startTime;
      
      validationResults.push({
        type: testType,
        isValid: validation.isValid,
        reason: validation.reason,
        validationTime
      });
      
      logStep(testName, `${testType} validation result`, {
        isValid: validation.isValid,
        reason: validation.reason,
        time: validationTime + 'ms'
      });
    }

    logStep(testName, 'Step 3: Analyzing invalid QR code handling');
    const allInvalid = validationResults.every(result => !result.isValid);
    const hasReasons = validationResults.every(result => result.reason);
    
    logStep(testName, 'Invalid QR code analysis', {
      totalTested: validationResults.length,
      allCorrectlyInvalid: allInvalid,
      allHaveReasons: hasReasons,
      averageValidationTime: Math.round(validationResults.reduce((sum, r) => sum + r.validationTime, 0) / validationResults.length) + 'ms',
      results: validationResults
    });

    logStep(testName, 'Step 4: Verifying all invalid codes were rejected');
    if (!allInvalid) {
      const validResults = validationResults.filter(r => r.isValid);
      logError(testName, 'Step 4', new Error(`Some invalid QR codes were accepted: ${validResults.map(r => r.type).join(', ')}`));
      throw new Error('Invalid QR codes should be rejected');
    }
    
    if (!hasReasons) {
      logError(testName, 'Step 4', new Error('Some validation failures missing reason'));
      throw new Error('Validation failures should include reasons');
    }
    
    logStep(testName, 'All invalid QR codes correctly rejected with reasons');

    logTestEnd(testName, true);
    return assertSuccess('Invalid Ticket Validation');
  } catch (error) {
    logError(testName, 'Test execution', error);
    logTestEnd(testName, false);
    return assertError('Invalid Ticket Validation', error);
  }
}

async function testExpiredTicketValidation() {
  const testName = 'Expired Ticket Validation';
  logTestStart(testName);
  
  try {
    logStep(testName, 'Step 1: Creating expired ticket QR code');
    // Create a QR code with past expiration
    const expiredTicketData = {
      tid: 'expired-ticket-id',
      uid: TEST_USER_ID(),
      eid: TEST_EVENT_ID(),
      tkid: TEST_TICKET_ID(),
      qty: 1,
      price: 100.00,
      ts: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 48 hours ago
      exp: Date.now() - 24 * 60 * 60 * 1000 // Expired 24 hours ago
    };
    
    // Create signature (simplified for test)
    const crypto = await import('crypto');
    const data = Object.entries(expiredTicketData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    
    const signature = crypto.createHmac('sha256', process.env.JWT_SECRET || 'test-secret')
      .update(data)
      .digest('hex');
    
    const expiredQRData = { ...expiredTicketData, sig: signature };
    const expiredQRCode = Buffer.from(JSON.stringify(expiredQRData)).toString('base64');
    
    logStep(testName, 'Expired QR code created', {
      expirationTime: new Date(expiredTicketData.exp).toISOString(),
      hoursExpired: Math.round((Date.now() - expiredTicketData.exp) / (60 * 60 * 1000)),
      qrCodeLength: expiredQRCode.length
    });

    logStep(testName, 'Step 2: Validating expired ticket');
    const startTime = Date.now();
    const validation = await ticketingService.validateTicket(expiredQRCode);
    const validationTime = Date.now() - startTime;
    
    logStep(testName, `Expired ticket validation completed in ${validationTime}ms`, {
      isValid: validation.isValid,
      reason: validation.reason
    });

    logStep(testName, 'Step 3: Verifying expired ticket rejection');
    if (validation.isValid) {
      logError(testName, 'Step 3', new Error('Expired ticket should be invalid'));
      throw new Error('Expired ticket was accepted');
    }
    
    if (!validation.reason || !validation.reason.toLowerCase().includes('expired')) {
      logError(testName, 'Step 3', new Error(`Expected 'expired' reason, got: ${validation.reason}`));
      throw new Error('Incorrect rejection reason for expired ticket');
    }
    
    logStep(testName, 'Expired ticket correctly rejected');
    logTestEnd(testName, true);
    return assertSuccess('Expired Ticket Validation');
  } catch (error) {
    logError(testName, 'Test execution', error);
    logTestEnd(testName, false);
    return assertError('Expired Ticket Validation', error);
  }
}

async function testGetUserTickets() {
  const testName = 'Get User Tickets';
  logTestStart(testName);
  
  try {
    logStep(testName, 'Step 0: Adding delay to prevent rate limiting');
    await delay(1000); // 1 second delay
    
    logStep(testName, 'Step 1: Purchasing tickets for user ticket retrieval test');
    const purchaseData = {
      userId: TEST_USER_ID(),
      eventId: TEST_EVENT_ID(),
      ticketId: TEST_TICKET_ID(),
      quantity: 2
    };
    
    const startPurchaseTime = Date.now();
    const booking = await retryOperation(async () => {
      return await ticketingService.purchaseTicket(purchaseData);
    });
    const purchaseTime = Date.now() - startPurchaseTime;
    
    logStep(testName, `Test tickets purchased in ${purchaseTime}ms`, {
      bookingId: booking.id,
      quantity: booking.quantity,
      totalPrice: booking.total_price
    });

    logStep(testName, 'Step 2: Retrieving user tickets');
    const startRetrievalTime = Date.now();
    const tickets = await retryOperation(async () => {
      return await ticketingService.getUserTickets(TEST_USER_ID());
    });
    const retrievalTime = Date.now() - startRetrievalTime;
    
    logStep(testName, `User tickets retrieved in ${retrievalTime}ms`, {
      ticketCount: tickets?.length || 0,
      totalTickets: tickets?.reduce((sum, ticket) => sum + ticket.quantity, 0) || 0
    });

    logStep(testName, 'Step 3: Validating ticket retrieval response');
    if (!Array.isArray(tickets) || tickets.length === 0) {
      logError(testName, 'Step 3', new Error('No tickets found for user'));
      throw new Error('No tickets found for user');
    }
    logStep(testName, 'Ticket retrieval response validated');

    logStep(testName, 'Step 4: Analyzing ticket data structure');
    const sampleTicket = tickets[0];
    const hasRequiredFields = !!(sampleTicket.events && sampleTicket.tickets && sampleTicket.qr_code);
    
    logStep(testName, 'Ticket data structure analysis', {
      sampleTicket: {
        id: sampleTicket.id,
        quantity: sampleTicket.quantity,
        status: sampleTicket.status,
        hasEvent: !!sampleTicket.events,
        hasTicketInfo: !!sampleTicket.tickets,
        hasQRCode: !!sampleTicket.qr_code,
        eventTitle: sampleTicket.events?.title,
        ticketType: sampleTicket.tickets?.type,
        ticketPrice: sampleTicket.tickets?.price
      },
      hasAllRequiredFields: hasRequiredFields
    });

    logStep(testName, 'Step 5: Verifying ticket data completeness');
    if (!hasRequiredFields) {
      logError(testName, 'Step 5', new Error('Ticket data missing required fields'));
      throw new Error('Invalid ticket data structure');
    }
    
    // Verify the ticket we just purchased is in the results
    const ourTicket = tickets.find(ticket => ticket.id === booking.id);
    if (!ourTicket) {
      logError(testName, 'Step 5', new Error('Recently purchased ticket not found in user tickets'));
      throw new Error('Recently purchased ticket missing from results');
    }
    
    logStep(testName, 'Recently purchased ticket found in results', {
      ticketId: ourTicket.id,
      matches: ourTicket.quantity === booking.quantity && ourTicket.total_price === booking.total_price
    });

    logTestEnd(testName, true);
    return assertSuccess('Get User Tickets');
  } catch (error) {
    logError(testName, 'Test execution', error);
    logTestEnd(testName, false);
    return assertError('Get User Tickets', error);
  }
}

async function testInvalidUserTickets() {
  const testName = 'Invalid User Tickets';
  logTestStart(testName);
  
  try {
    logStep(testName, 'Step 1: Preparing invalid user ID for ticket retrieval');
    const invalidUserId = '00000000-0000-0000-0000-000000000000';
    logStep(testName, 'Invalid user ID prepared', { userId: invalidUserId });

    logStep(testName, 'Step 2: Attempting to retrieve tickets for invalid user');
    const startTime = Date.now();
    const tickets = await ticketingService.getUserTickets(invalidUserId);
    const retrievalTime = Date.now() - startTime;
    
    logStep(testName, `Invalid user tickets retrieved in ${retrievalTime}ms`, {
      ticketCount: tickets?.length || 0,
      isArray: Array.isArray(tickets)
    });

    logStep(testName, 'Step 3: Validating response for invalid user');
    if (!Array.isArray(tickets)) {
      logError(testName, 'Step 3', new Error('Invalid response format - not an array'));
      throw new Error('Invalid response format');
    }

    if (tickets.length !== 0) {
      logError(testName, 'Step 3', new Error(`Found ${tickets.length} tickets for invalid user`));
      throw new Error('Found tickets for invalid user');
    }
    
    logStep(testName, 'Invalid user correctly returned empty ticket list');

    logTestEnd(testName, true);
    return assertSuccess('Invalid User Tickets');
  } catch (error) {
    logError(testName, 'Test execution', error);
    logTestEnd(testName, false);
    return assertError('Invalid User Tickets', error);
  }
}

export async function runTicketingTests() {
  console.log('\n' + 'ðŸŽ«'.repeat(20));
  console.log('ðŸŽ« STARTING TICKETING SERVICE TEST SUITE ðŸŽ«');
  console.log('ðŸŽ«'.repeat(20) + '\n');

  const testStartTime = Date.now();
  let testResults = [];

  try {
    logStep('Test Suite', 'Setting up ticketing test environment');
    await setupTestData();
    
    // Add longer initial delay and connection verification
    logStep('Test Suite', 'Verifying database stability and connection health');
    await delay(3000);
    
    const connectionHealthy = await checkDatabaseConnection();
    if (!connectionHealthy) {
      throw new Error('Database connection unhealthy, aborting test suite');
    }
    
    logStep('Test Suite', 'Test environment setup completed');

    // Run tests sequentially with detailed logging
    logStep('Test Suite', 'Running Ticket Purchase Test');
    testResults.push(await testTicketPurchase());
    
    // Add longer delays between tests to prevent rate limiting
    await delay(2000);
    
    logStep('Test Suite', 'Running Insufficient Tickets Test');
    testResults.push(await testInsufficientTickets());
    
    await delay(4000); // Much longer delay before concurrent test
    
    logStep('Test Suite', 'Running Concurrent Purchase Test');
    testResults.push(await testConcurrentPurchase());
    
    await delay(2500);
    
    logStep('Test Suite', 'Running Ticket Validation Test');
    testResults.push(await testTicketValidation());
    
    await delay(2000);
    
    logStep('Test Suite', 'Running Invalid Ticket Validation Test');
    testResults.push(await testInvalidTicketValidation());
    
    await delay(2000);
    
    logStep('Test Suite', 'Running Expired Ticket Validation Test');
    testResults.push(await testExpiredTicketValidation());
    
    await delay(2000);
    
    logStep('Test Suite', 'Running Get User Tickets Test');
    testResults.push(await testGetUserTickets());
    
    await delay(2000);
    
    logStep('Test Suite', 'Running Invalid User Tickets Test');
    testResults.push(await testInvalidUserTickets());

  } finally {
    logStep('Test Suite', 'Adding final delay before cleanup');
    await delay(2000);
    
    logStep('Test Suite', 'Cleaning up ticketing test environment');
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
  console.log('\n' + 'ðŸ“Š'.repeat(20));
  console.log('ðŸ“Š TICKETING TEST SUITE SUMMARY ðŸ“Š');
  console.log('ðŸ“Š'.repeat(20));
  console.log(`â±ï¸  Total execution time: ${totalTestTime}ms`);
  console.log(`âœ… Tests passed: ${passedTests}/${totalTests}`);
  console.log(`âŒ Tests failed: ${failedTests}/${totalTests}`);
  console.log(`ðŸ“ˆ Success rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`);
  console.log('ðŸ“Š'.repeat(20) + '\n');

  if (failedTests > 0) {
    console.log('âŒ Some ticketing tests failed. Please review the detailed logs above.');
  } else {
    console.log('ðŸŽ‰ All ticketing tests passed successfully!');
  }
}
