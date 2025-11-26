import { runAuthTests } from './authTests.js';
import { runSystemAuthTests } from './systemAuthTests.js';
import { runPaymentTests } from './paymentTests.js';
import { runNotificationTests } from './notificationTests.js';
import { runEventTests } from './eventTests.js';
import { runTicketingTests } from './ticketingTests.js';
import { runEventManagementTests } from './eventManagementTests.js';

async function runAllTests() {
  console.log('Running All Tests\n');
  
  // Run auth tests first to create the test user
  await runAuthTests();
  /*console.log('\n-------------------\n');
 
  // Now run other tests
  await runPaymentTests();
  console.log('\n-------------------\n');
  await runSystemAuthTests();
  console.log('\n-------------------\n');
  await runNotificationTests();
  console.log('\n-------------------\n');
   await runEventTests(); 
  console.log('\n-------------------\n');
  await runTicketingTests();*/
  console.log('\n-------------------\n');
   await runEventManagementTests();
}

runAllTests().catch(console.error);