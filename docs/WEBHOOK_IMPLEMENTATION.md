# Webhook Implementation for Gelato Order Updates

This document describes the webhook implementation for receiving order status updates from Gelato.

## Overview

The webhook endpoint `/api/webhook` receives JSON payloads from Gelato containing order status updates and automatically updates the corresponding orders in MongoDB.

## Webhook Endpoint

**URL:** `POST /api/webhook`

**Purpose:** Receive and process order status updates from Gelato

**Authentication:** None (webhook should be secured by Gelato's IP whitelist or signature validation)

## Supported Payload Formats

### Standard Gelato Webhook Payload

```json
{
  "orderId": "gelato-order-12345",
  "status": "shipped",
  "trackingNumber": "TRK123456789",
  "trackingUrl": "https://tracking.gelato.com/TRK123456789",
  "shipping": {
    "carrier": "DHL",
    "service": "Express",
    "estimatedDelivery": "2024-01-20T10:00:00Z"
  },
  "metadata": {
    "shippedAt": "2024-01-15T10:30:00Z",
    "facility": "US-East"
  }
}
```

### Alternative Payload Formats

The webhook supports multiple field name variations:

```json
{
  "gelatoOrderId": "gelato-order-12345",
  "status": "delivered",
  "tracking": {
    "number": "TRK123456789",
    "url": "https://tracking.gelato.com/TRK123456789"
  }
}
```

```json
{
  "id": "gelato-order-12345",
  "status": "processing",
  "orderNumber": "ORD-1234567890-0001"
}
```

## Status Mapping

| Gelato Status | Internal Status | Description |
|---------------|-----------------|-------------|
| `pending` | `pending` | Order received by Gelato |
| `processing` | `processing` | Order being processed |
| `in_production` | `in_production` | Products being printed |
| `production` | `in_production` | Alternative production status |
| `shipped` | `shipped` | Order shipped to customer |
| `delivered` | `delivered` | Order delivered to customer |
| `completed` | `delivered` | Order completed |
| `fulfilled` | `delivered` | Order fulfilled |
| `cancelled` | `cancelled` | Order cancelled |
| `canceled` | `cancelled` | Alternative cancelled status |
| `failed` | `failed` | Order failed |
| `error` | `failed` | Order error |

## Request Validation

The webhook validates incoming payloads for:

1. **Required Fields:**
   - At least one order identifier (`orderId`, `gelatoOrderId`, `id`, or `orderNumber`)
   - `status` field

2. **Data Types:**
   - Payload must be a valid JSON object
   - Status must be a string

3. **Order Existence:**
   - Order must exist in MongoDB
   - Order can be found by Gelato order ID or order number

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "data": {
    "orderId": "507f1f77bcf86cd799439012",
    "orderNumber": "ORD-1234567890-0001",
    "gelatoOrderId": "gelato-order-12345",
    "status": "shipped",
    "trackingNumber": "TRK123456789",
    "processedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Order not found",
  "identifier": "gelato-order-12345"
}
```

## Database Updates

When a webhook is processed successfully, the following fields are updated in the order document:

- `status`: New status from Gelato
- `gelatoOrderId`: Gelato order ID (if not already set)
- `gelatoTrackingNumber`: Tracking number (if provided)
- `gelatoTrackingUrl`: Tracking URL (if provided)
- `metadata`: Additional metadata from webhook
- `shipping`: Shipping information (if provided)
- `estimatedDelivery`: Estimated delivery date (if provided)

## Testing

### Test Endpoints

#### Health Check
```bash
GET /api/webhook/test
```

#### Test Webhook Processing
```bash
POST /api/webhook/test
Content-Type: application/json

{
  "scenario": "shipped"
}
```

Available test scenarios:
- `processing`
- `in_production`
- `shipped`
- `delivered`
- `cancelled`

### Automated Testing

Run the webhook test suite:

```bash
npm run test:webhook
```

This will:
1. Create a test order
2. Send various webhook payloads
3. Verify order status updates
4. Test error scenarios
5. Clean up test data

### Manual Testing with curl

```bash
# Test processing status
curl -X POST http://localhost:5000/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "gelato-order-12345",
    "status": "processing"
  }'

# Test shipped status with tracking
curl -X POST http://localhost:5000/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "gelato-order-12345",
    "status": "shipped",
    "trackingNumber": "TRK123456789",
    "trackingUrl": "https://tracking.gelato.com/TRK123456789"
  }'
```

## Error Handling

### Validation Errors

- **400 Bad Request**: Invalid payload structure
- **404 Not Found**: Order not found
- **500 Internal Server Error**: Database or processing errors

### Logging

All webhook processing is logged with:
- Incoming payload (in development mode)
- Order identification
- Status updates
- Error details

### Retry Logic

Gelato should implement retry logic for failed webhook deliveries:
- Retry failed requests with exponential backoff
- Maximum retry attempts: 5
- Retry intervals: 1s, 2s, 4s, 8s, 16s

## Security Considerations

### IP Whitelisting

Configure Gelato to send webhooks only from known IP addresses:
- Add Gelato's webhook IP ranges to server firewall
- Implement IP-based access control

### Signature Validation

If Gelato provides webhook signatures:
1. Implement signature validation in the webhook handler
2. Verify HMAC-SHA256 signatures
3. Reject unsigned or invalid signatures

### Rate Limiting

Implement rate limiting to prevent abuse:
- Maximum requests per IP: 100/minute
- Maximum requests per order: 10/minute

## Monitoring

### Metrics to Track

- Webhook processing success rate
- Average processing time
- Error rates by type
- Order status update frequency

### Alerts

Set up alerts for:
- High webhook error rates
- Failed order status updates
- Webhook endpoint downtime

## Troubleshooting

### Common Issues

1. **Order Not Found**
   - Verify Gelato order ID matches database
   - Check order number format
   - Ensure order exists and is active

2. **Invalid Status**
   - Check status mapping table
   - Verify Gelato status format
   - Add new status mappings if needed

3. **Database Errors**
   - Check MongoDB connection
   - Verify order model schema
   - Check database permissions

4. **Webhook Not Received**
   - Verify webhook URL in Gelato settings
   - Check server logs for incoming requests
   - Test webhook endpoint manually

### Debug Mode

Enable detailed logging:

```env
NODE_ENV=development
```

This will log:
- Full webhook payloads
- Database queries
- Processing steps
- Error details

## Configuration

### Environment Variables

```env
# Webhook configuration
WEBHOOK_SECRET=your_webhook_secret_here
WEBHOOK_TIMEOUT=30000
```

### Gelato Dashboard Settings

Configure webhook URL in Gelato dashboard:
```
https://yourdomain.com/api/webhook
```

Enable webhook events:
- Order status changes
- Shipping updates
- Delivery confirmations

## API Reference

### POST /api/webhook

Process Gelato webhook notification.

**Request Body:**
```json
{
  "orderId": "string",
  "status": "string",
  "trackingNumber": "string (optional)",
  "trackingUrl": "string (optional)",
  "shipping": "object (optional)",
  "metadata": "object (optional)"
}
```

**Response:**
```json
{
  "success": "boolean",
  "message": "string",
  "data": "object (optional)"
}
```

### GET /api/webhook/test

Health check for webhook endpoint.

**Response:**
```json
{
  "success": true,
  "message": "Webhook endpoint is working",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### POST /api/webhook/test

Test webhook processing with sample data.

**Request Body:**
```json
{
  "scenario": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test webhook processed successfully",
  "data": {
    "orderId": "string",
    "orderNumber": "string",
    "status": "string",
    "scenario": "string"
  }
}
```







