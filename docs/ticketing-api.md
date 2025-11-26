# Ticketing Service API Documentation

## Overview
The Ticketing Service provides secure ticket management functionality for the HVFLVSPOT platform, including ticket purchases, validation, and user ticket retrieval. This service is implemented with QR code generation and validation capabilities.

## Base URL
```
/tickets
```

## Implementation Status
- ✅ **FULLY IMPLEMENTED** - Code complete with QR generation
- ⚠️ **PARTIALLY TESTED** - Some RLS policy issues in test environment
- ✅ **QR CODE SYSTEM** - Secure ticket validation with HMAC signatures
- ✅ **DOCUMENTED** - Complete API documentation

## Known Issues
- Some RLS policies may need adjustment for ticket creation in test environments
- Statistics calculation depends on ticket data availability
- Concurrent purchase handling needs optimization

## Features Implemented (Code Ready)
- QR code generation with HMAC-SHA256 signatures
- Ticket validation with expiration checking
- Concurrent purchase handling with optimistic locking
- User ticket retrieval with full event details
- Inventory management with atomic updates
- 24-hour ticket expiration system
- Digital signature verification

## Authentication
All endpoints require authentication using JWT Bearer token.

```http
Authorization: Bearer <access_token>
```

## Endpoints

### 1. Purchase Ticket
Purchase tickets for an event.

```http
POST /tickets/purchase
```

#### Request Headers
| Name | Required | Description |
|------|----------|-------------|
| Authorization | Yes | Bearer token |
| Content-Type | Yes | application/json |

#### Request Body
```json
{
  "eventId": "uuid",
  "ticketId": "uuid",
  "quantity": 1
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| eventId | UUID | Yes | Event ID |
| ticketId | UUID | Yes | Ticket type ID |
| quantity | Integer | No | Number of tickets (default: 1, max: 10) |

#### Success Response (201 Created)
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "event_id": "uuid",
  "ticket_id": "uuid",
  "quantity": 1,
  "total_price": 100.00,
  "status": "confirmed",
  "qr_code": "base64_encoded_qr_code",
  "created_at": "2024-01-09T01:53:31Z"
}
```

#### Error Responses
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: Event or ticket not found
- `409 Conflict`: Insufficient tickets available
- `500 Internal Server Error`: Server error

#### Purchase Flow
1. Validate ticket availability
2. Process payment through Payment Service
3. Update ticket inventory atomically
4. Generate QR code with digital signature
5. Create booking record
6. Return booking with QR code
### 2. Validate Ticket
Validate a ticket's QR code.

```http
POST /tickets/validate
```

#### Request Headers
| Name | Required | Description |
|------|----------|-------------|
| Authorization | Yes | Bearer token |
| Content-Type | Yes | application/json |

#### Request Body
```json
{
  "qrCode": "base64_encoded_qr_code"
}
```

#### Success Response (200 OK)
```json
{
  "isValid": true,
  "booking": {
    "id": "uuid",
    "eventTitle": "Event Name",
    "eventDate": "2024-02-01T19:00:00Z",
    "ticketType": "VIP",
    "quantity": 1,
    "status": "confirmed"
  }
}
```

#### Error Response (400 Bad Request)
```json
{
  "isValid": false,
  "reason": "Invalid ticket signature"
}
```

#### Validation Process
1. Decode Base64 QR code data
2. Verify HMAC-SHA256 signature
3. Check ticket expiration (24 hours)
4. Validate against database records
5. Return validation result with booking details
### 3. Get User Tickets
Retrieve user's purchased tickets.

```http
GET /tickets/view
```

#### Request Headers
| Name | Required | Description |
|------|----------|-------------|
| Authorization | Yes | Bearer token |

#### Success Response (200 OK)
```json
[
  {
    "id": "uuid",
    "event": {
      "title": "Event Name",
      "description": "Event description",
      "location": "Venue Name",
      "start_date": "2024-02-01T19:00:00Z",
      "end_date": "2024-02-01T23:00:00Z",
      "image_url": "https://example.com/image.jpg"
    },
    "ticket": {
      "type": "VIP",
      "price": 100.00
    },
    "quantity": 1,
    "total_price": 100.00,
    "status": "confirmed",
    "qr_code": "base64_encoded_qr_code",
    "created_at": "2024-01-09T01:53:31Z"
  }
]
```

#### Ticket Data Structure
Each ticket includes:
- Complete event information
- Ticket type and pricing details
- QR code for validation
- Purchase timestamp
- Booking status
## Error Handling

### Error Response Format
```json
{
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": {} // Optional additional information
}
```

### Common Error Codes
| Code | Description |
|------|-------------|
| INVALID_INPUT | Request validation failed |
| UNAUTHORIZED | Authentication required |
| TICKET_NOT_FOUND | Ticket does not exist |
| INSUFFICIENT_TICKETS | Not enough tickets available |
| INVALID_QR_CODE | QR code validation failed |
| SERVER_ERROR | Internal server error |

## QR Code Format

### Structure
The QR code contains a Base64-encoded JSON payload with the following structure:

```json
{
  "tid": "ticket_uuid",
  "uid": "user_id",
  "eid": "event_id",
  "tkid": "ticket_id",
  "qty": 1,
  "price": 100.00,
  "ts": "2024-01-09T01:53:31Z",
  "exp": 1704852811000,
  "sig": "hmac_signature"
}
```

### Security Features
1. Digital Signature
   - HMAC-SHA256 signature of payload
   - Prevents tampering with ticket data
   - Verified during validation

2. Expiration Time
   - 24-hour validity from purchase
   - Prevents ticket reuse
   - Configurable expiration window

3. Unique Identifiers
   - UUID for each ticket
   - Links to database records
   - Prevents duplication

### Signature Generation
```javascript
const data = Object.entries(payload)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([k, v]) => `${k}=${v}`)
  .join('&');

const signature = crypto
  .createHmac('sha256', process.env.JWT_SECRET)
  .update(data)
  .digest('hex');
```
## Rate Limiting
- Purchase: 10 requests per minute
- Validation: 100 requests per minute
- View: 60 requests per minute

## Frontend Integration

### Error Handling
The frontend includes comprehensive error handling for ticketing:

```javascript
try {
  const booking = await ticketApi.purchase({
    eventId,
    ticketId,
    quantity
  });
} catch (error) {
  if (error.message.includes('RLS') || error.message.includes('not yet enabled')) {
    // Show user-friendly message about ticketing availability
    showTicketingUnavailableMessage();
  } else {
    // Handle other errors
    showGenericErrorMessage();
  }
}
```

### Fallback Behavior
When ticketing service is unavailable:
- Payment processing still works
- Clear messaging about ticket availability
- Graceful degradation of functionality

## Best Practices

### Ticket Purchase
1. Always verify ticket availability before purchase
2. Use optimistic locking for inventory updates
3. Implement retry logic for concurrent purchases
4. Store QR codes securely

### Ticket Validation
1. Always verify digital signatures
2. Check expiration timestamps
3. Validate against database records
4. Log validation attempts

### Error Handling
1. Use specific error codes
2. Include helpful error messages
3. Log validation failures
4. Implement rate limiting

## Implementation Guidelines

### Concurrent Purchase Handling
```javascript
// Example of safe ticket purchase
const purchaseTicket = async (ticketId, quantity) => {
  let retries = 3;
  while (retries > 0) {
    try {
      // Begin transaction
      const result = await beginPurchase(ticketId, quantity);
      if (!result.success) {
        throw new Error(result.message);
      }
      
      // Complete purchase
      return await completePurchase(result.ticket);
    } catch (error) {
      retries--;
      if (retries === 0) throw error;
      await delay(Math.pow(2, 3 - retries) * 100);
    }
  }
};
```

### QR Code Validation
```javascript
// Example of QR code validation
const validateTicket = async (qrCode) => {
  // Decode and parse QR code
  const data = await decodeQRCode(qrCode);
  
  // Verify signature
  if (!verifySignature(data)) {
    return { isValid: false, reason: 'Invalid signature' };
  }
  
  // Check expiration
  if (isExpired(data.exp)) {
    return { isValid: false, reason: 'Ticket expired' };
  }
  
  // Verify against database
  return await verifyBooking(data);
};
```

## Future Enhancements

### Planned Features
1. Ticket Transfer
   - Allow users to transfer tickets
   - Implement secure transfer protocol
   - Track ticket ownership history

2. Batch Validation
   - Validate multiple tickets at once
   - Optimize for large events
   - Bulk QR code processing

3. Enhanced Security
   - Add dynamic QR codes
   - Implement NFC support
   - Add biometric verification

### Integration Points
1. Payment Service
   - Handle ticket payments
   - Process refunds
   - Track transaction history

2. Event Service
   - Check event capacity
   - Verify event dates
   - Handle event cancellations

3. Notification Service
   - Send purchase confirmations
   - Deliver QR codes
   - Send event reminders