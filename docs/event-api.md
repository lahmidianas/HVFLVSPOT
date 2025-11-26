# Event Service API Documentation

## Overview
The Event Service provides functionality for managing events, searching events, and generating personalized event recommendations on the HVFLVSPOT platform. This service includes advanced search capabilities with full-text search, category filtering, and personalized recommendations.

## Base URL
```
/events
```

## Implementation Status
- ✅ **FULLY IMPLEMENTED** - Core search and recommendations working
- ⚠️ **PARTIALLY TESTED** - 6/7 tests passing
- ⚠️ **TICKET INTEGRATION** - Some RLS policy issues with ticket creation
- ✅ **DOCUMENTED** - Complete API documentation

## Features Implemented
- Advanced event search with full-text capabilities
- Category and location-based filtering
- Price and date range filtering
- Personalized event recommendations
- Pagination and result sorting
- Fallback mechanisms for frontend integration

## Authentication
Search endpoints are public. Recommendations require authentication using JWT Bearer token.

```http
Authorization: Bearer <access_token>
```

## Endpoints

### 1. Search Events
Search for events with advanced filtering and full-text search capabilities.

```http
GET /events/search
```

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| keywords | String | No | Search terms |
| category | UUID | No | Category ID for filtering |
| location | String | No | Event location |
| startDate | ISO Date | No | Event start date |
| endDate | ISO Date | No | Event end date |
| minPrice | Decimal | No | Minimum ticket price |
| maxPrice | Decimal | No | Maximum ticket price |
| page | Integer | No | Page number (default: 1) |
| limit | Integer | No | Results per page (default: 10, max: 100) |

#### Success Response (200 OK)
```json
{
  "events": [
    {
      "id": "uuid",
      "title": "Event Name",
      "description": "Event description",
      "location": "Venue Name",
      "start_date": "2024-02-01T19:00:00Z",
      "end_date": "2024-02-01T23:00:00Z",
      "category": {
        "name": "Category Name",
        "slug": "category-slug"
      },
      "price": 100.00,
      "image_url": "https://example.com/image.jpg",
      "capacity": 1000,
      "organizer_id": "uuid"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### 2. Get Recommended Events
Get personalized event recommendations for a user.

```http
GET /events/recommended
```

#### Request Headers
| Name | Required | Description |
|------|----------|-------------|
| Authorization | Yes | Bearer token |

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | Integer | No | Number of recommendations (default: 10) |
| offset | Integer | No | Offset for pagination (default: 0) |

#### Success Response (200 OK)
```json
{
  "events": [
    {
      "id": "uuid",
      "title": "Event Name",
      "description": "Event description",
      "location": "Venue Name",
      "start_date": "2024-02-01T19:00:00Z",
      "end_date": "2024-02-01T23:00:00Z",
      "category": {
        "name": "Category Name",
        "slug": "category-slug"
      },
      "price": 100.00,
      "image_url": "https://example.com/image.jpg",
      "_score": 4.5,
      "capacity": 1000
    }
  ],
  "metadata": {
    "total": 10,
    "hasMore": true
  }
}
```

### 3. Create Event
Create a new event (requires organizer role).

```http
POST /organizer/events/create
```

#### Request Headers
| Name | Required | Description |
|------|----------|-------------|
| Authorization | Yes | Bearer token |
| Content-Type | Yes | application/json |

#### Request Body
```json
{
  "title": "Event Name",
  "description": "Event description",
  "location": "Venue Name",
  "start_date": "2024-02-01T19:00:00Z",
  "end_date": "2024-02-01T23:00:00Z",
  "category_id": "uuid",
  "price": 100.00,
  "capacity": 1000,
  "image_url": "https://example.com/image.jpg",
  "tickets": [
    {
      "type": "General Admission",
      "price": 100.00,
      "quantity": 500
    },
    {
      "type": "VIP",
      "price": 200.00,
      "quantity": 100
    }
  ]
}
```

#### Success Response (201 Created)
```json
{
  "id": "uuid",
  "title": "Event Name",
  "slug": "event-name",
  "description": "Event description",
  "location": "Venue Name",
  "start_date": "2024-02-01T19:00:00Z",
  "end_date": "2024-02-01T23:00:00Z",
  "category_id": "uuid",
  "organizer_id": "uuid",
  "price": 100.00,
  "capacity": 1000,
  "image_url": "https://example.com/image.jpg",
  "created_at": "2024-01-09T01:53:31Z",
  "tickets": [
    {
      "id": "uuid",
      "type": "General Admission",
      "price": 100.00,
      "quantity": 500
    }
  ]
}
```

### 4. Update Event
Update an existing event (requires organizer role and ownership).

```http
PUT /organizer/events/:eventId/update
```

#### Request Headers
| Name | Required | Description |
|------|----------|-------------|
| Authorization | Yes | Bearer token |
| Content-Type | Yes | application/json |

#### Request Body
Same as create event, but all fields are optional.

### 5. Get Event Statistics
Get statistics for an event (requires organizer role and ownership).

```http
GET /organizer/events/:eventId/stats
```

#### Success Response (200 OK)
```json
{
  "event": {
    "title": "Event Name",
    "start_date": "2024-02-01T19:00:00Z",
    "capacity": 1000
  },
  "ticketsSold": 150,
  "ticketsAvailable": 850,
  "revenue": 15000.00,
  "ticketTypes": {
    "General Admission": {
      "sold": 100,
      "available": 400,
      "revenue": 10000.00
    },
    "VIP": {
      "sold": 50,
      "available": 50,
      "revenue": 5000.00
    }
  },
  "recentBookings": []
}
```
## Search Features

### Full-Text Search
- Uses PostgreSQL's full-text search capabilities
- Weighted search across multiple fields:
  - Title (weight: A)
  - Description (weight: B)
  - Location (weight: C)
- Supports phrase matching and word stemming
- Handles typos and similar terms

### Location Search
- Text-based location search
- Supports partial matches
- Case-insensitive matching
- Trigram similarity for fuzzy matching

### Date and Price Filtering
- Date range filtering
- Price range filtering
- Combines multiple filters
- Validates filter combinations

## Recommendation System

### Scoring Factors
1. Category Match (weight: 2.0)
   - Based on user's preferred categories
   - Higher score for exact matches

2. Location Match (weight: 1.5)
   - Based on user's preferred locations
   - Considers travel distance

3. Price Match (weight: 1.0)
   - Within user's preferred price range
   - Price sensitivity adjustment

4. Time Factor (weight: 1.0)
   - Events happening sooner score higher
   - 30-day sliding scale

### Personalization
- User preferences stored in metadata
- Booking history analysis
- Category preferences
- Location preferences
- Price range preferences

## Frontend Integration

### Direct Database Access
For reference data (categories, public events), the frontend can query Supabase directly:

```javascript
const { data: categories } = await supabase
  .from('categories')
  .select('*')
  .order('name');
```

### API Integration
For complex operations, use the backend API:

```javascript
const result = await eventApi.search({
  keywords: 'music festival',
  category: 'uuid',
  page: 1,
  limit: 12
});
```

### Error Handling
The frontend includes comprehensive error handling:
- Network connectivity issues
- Backend unavailability
- Fallback to direct database queries
- User-friendly error messages

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
| FORBIDDEN | Insufficient permissions |
| NOT_FOUND | Event not found |
| VALIDATION_ERROR | Data validation failed |
| SERVER_ERROR | Internal server error |

## Rate Limiting
- Search: 60 requests per minute
- Recommendations: 30 requests per minute
- Create: 10 requests per minute

## Health Check

The service includes a health check endpoint:

```http
GET /health
```

Returns:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-09T01:53:31Z"
}
```
## Best Practices

### Search Implementation
1. Use proper indexes
2. Implement caching
3. Validate search parameters
4. Handle empty results gracefully

### Recommendation Engine
1. Update scores periodically
2. Cache recommendations
3. Fallback to popular events
4. Monitor recommendation quality

### Event Creation
1. Validate dates and times
2. Check for duplicates
3. Verify organizer permissions
4. Handle image uploads securely

## Implementation Guidelines

### Search Query Optimization
```sql
-- Example of optimized search query
SELECT e.*, 
       ts_rank(e.search_vector, websearch_to_tsquery('english', $1)) as rank
FROM events e
WHERE e.search_vector @@ websearch_to_tsquery('english', $1)
  AND e.start_date >= $2
  AND e.price BETWEEN $3 AND $4
ORDER BY rank DESC
LIMIT $5 OFFSET $6;
```

### Recommendation Scoring
```javascript
// Example of recommendation scoring
const scoreEvent = (event, preferences) => {
  let score = 1.0;
  
  // Category match
  if (preferences.categories.includes(event.category_id)) {
    score += 2.0;
  }
  
  // Location match
  if (preferences.locations.includes(event.location)) {
    score += 1.5;
  }
  
  // Price match
  if (event.price <= preferences.maxPrice) {
    score += 1.0;
  }
  
  // Time factor
  const daysUntilEvent = calculateDaysUntilEvent(event.start_date);
  score += Math.max(0, (30 - daysUntilEvent) / 30);
  
  return score;
};
```

## Future Enhancements

### Planned Features
1. Advanced Search
   - Geolocation-based search
   - Category hierarchy
   - Dynamic filtering

2. Enhanced Recommendations
   - Collaborative filtering
   - Social graph integration
   - Time-based preferences

3. Event Management
   - Recurring events
   - Event series
   - Dynamic pricing

### Integration Points
1. Ticketing Service
   - Ticket availability
   - Capacity management
   - Sales tracking

2. User Service
   - Organizer profiles
   - User preferences
   - Social connections

3. Analytics Service
   - Event popularity
   - Search trends
   - Recommendation performance