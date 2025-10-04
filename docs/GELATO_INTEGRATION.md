# Gelato API Integration

This document describes the Gelato API integration for forwarding orders and handling webhooks.

## Overview

The Gelato integration allows the e-commerce platform to:
1. Forward customer orders to Gelato for printing and fulfillment
2. Receive order status updates via webhooks
3. Track order progress from creation to delivery

## Configuration

### Environment Variables

Add the following environment variables to your `.env` file:

```env
# Gelato API Configuration
GELATO_API_KEY=your_gelato_api_key_here
GELATO_API_URL=https://api.gelato.com/v4
```

### API Key Setup

1. Log in to your Gelato dashboard
2. Navigate to API settings
3. Generate a new API key
4. Add the key to your environment variables

## API Endpoints

### Order Forwarding

**Endpoint:** `POST https://api.gelato.com/v4/orders`

**Headers:**
```
Authorization: Bearer {GELATO_API_KEY}
Content-Type: application/json
Accept: application/json
```

**Request Body:**
```json
{
  "order": {
    "orderNumber": "ORD-1234567890-0001",
    "customer": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1-555-123-4567"
    },
    "shippingAddress": {
      "firstName": "John",
      "lastName": "Doe",
      "address": "123 Main Street",
      "city": "New York",
      "postalCode": "10001",
      "country": "US"
    },
    "items": [
      {
        "productId": "gelato-tshirt-001",
        "quantity": 2,
        "options": {
          "size": "L",
          "color": "Blue"
        },
        "metadata": {
          "originalProductId": "507f1f77bcf86cd799439011",
          "productName": "Custom T-Shirt",
          "unitPrice": 24.99
        }
      }
    ],
    "metadata": {
      "originalOrderId": "507f1f77bcf86cd799439012",
      "orderNumber": "ORD-1234567890-0001",
      "total": 59.97,
      "subtotal": 49.98,
      "shipping": 5.99,
      "tax": 4.00
    }
  }
}
```

**Response:**
```json
{
  "order": {
    "id": "gelato-order-12345",
    "status": "pending",
    "trackingNumber": "TRK123456789",
    "trackingUrl": "https://tracking.gelato.com/TRK123456789"
  }
}
```

## Implementation

### Service Class

The `GelatoService` class handles all API interactions:

```javascript
const { forwardToGelato } = require('../services/gelatoService');

// Forward order to Gelato
const response = await forwardToGelato(order);

if (response.success) {
  console.log('Order ID:', response.data.gelatoOrderId);
} else {
  console.error('Error:', response.message);
}
```

### Order Processing Flow

1. **Order Creation**: Customer completes checkout
2. **Order Validation**: Validate order data and products
3. **Gelato Forwarding**: Send order to Gelato API
4. **Status Update**: Update order status based on response
5. **Webhook Handling**: Receive status updates from Gelato

### Error Handling

The integration includes comprehensive error handling:

- **API Key Missing**: Returns error if API key not configured
- **Network Errors**: Handles connection timeouts and failures
- **API Errors**: Processes Gelato API error responses
- **Validation Errors**: Validates order data before sending

## Webhook Integration

### Webhook Endpoint

**URL:** `POST /api/webhook`

**Purpose:** Receive order status updates from Gelato

**Expected Payload:**
```json
{
  "orderId": "gelato-order-12345",
  "status": "shipped",
  "trackingNumber": "TRK123456789",
  "trackingUrl": "https://tracking.gelato.com/TRK123456789",
  "metadata": {
    "shippedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Status Mapping

| Gelato Status | Internal Status | Description |
|---------------|-----------------|-------------|
| pending | pending | Order received |
| processing | processing | Order being processed |
| in_production | in_production | Products being printed |
| shipped | shipped | Order shipped |
| delivered | delivered | Order delivered |
| cancelled | cancelled | Order cancelled |
| failed | failed | Order failed |

## Testing

### Test Script

Run the integration test:

```bash
npm run test:gelato
```

This will:
1. Create a test order
2. Forward it to Gelato
3. Retrieve order status
4. Clean up test data

### Manual Testing

1. **Create Test Order**: Use the checkout API with test data
2. **Check Logs**: Monitor server logs for API calls
3. **Verify Database**: Check order status in MongoDB
4. **Test Webhook**: Send test webhook payload

## Monitoring

### Logging

The integration logs all API interactions:

```
[INFO] Sending order to Gelato API: {...}
[SUCCESS] Order successfully sent to Gelato: {...}
[ERROR] Failed to send order to Gelato: {...}
```

### Metrics

Track the following metrics:
- Order forwarding success rate
- API response times
- Error rates by type
- Webhook processing times

## Troubleshooting

### Common Issues

1. **API Key Invalid**
   - Verify API key in environment variables
   - Check key permissions in Gelato dashboard

2. **Network Timeouts**
   - Increase timeout in service configuration
   - Check network connectivity

3. **Order Validation Errors**
   - Verify product IDs exist in Gelato
   - Check required fields in order data

4. **Webhook Not Received**
   - Verify webhook URL in Gelato settings
   - Check server logs for incoming requests

### Debug Mode

Enable debug logging:

```env
NODE_ENV=development
```

This will log detailed API requests and responses.

## Security

### API Key Security
- Store API keys in environment variables
- Never commit keys to version control
- Rotate keys regularly

### Webhook Security
- Validate webhook signatures (if provided by Gelato)
- Use HTTPS for webhook endpoints
- Implement rate limiting

## Support

For Gelato API support:
- Check Gelato API documentation
- Contact Gelato support team
- Monitor Gelato status page

For integration issues:
- Check server logs
- Run test scripts
- Review this documentation



