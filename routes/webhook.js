const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// POST /webhook - Handle Gelato webhook notifications
router.post('/', async (req, res) => {
  try {
    const webhookData = req.body;
    
    console.log('Received Gelato webhook:', JSON.stringify(webhookData, null, 2));

    // Validate webhook payload structure
    const validation = validateGelatoWebhookPayload(webhookData);
    if (!validation.isValid) {
      console.error('Invalid webhook payload:', validation.errors);
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook payload',
        errors: validation.errors
      });
    }

    // Extract order identifier from webhook data
    const orderIdentifier = extractOrderIdentifier(webhookData);
    if (!orderIdentifier) {
      return res.status(400).json({
        success: false,
        message: 'Could not identify order from webhook data'
      });
    }

    // Find order by Gelato order ID or order number
    const order = await Order.findOne({
      $or: [
        { gelatoOrderId: orderIdentifier },
        { orderNumber: orderIdentifier }
      ]
    });

    if (!order) {
      console.log('Order not found for webhook identifier:', orderIdentifier);
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        identifier: orderIdentifier
      });
    }

    // Map Gelato status to internal status
    const newStatus = mapGelatoStatus(webhookData.status);
    if (!newStatus) {
      console.warn(`Unknown Gelato status: ${webhookData.status}`);
      return res.status(400).json({
        success: false,
        message: `Unknown status: ${webhookData.status}`
      });
    }

    // Prepare update data
    const updateData = {
      orderId: webhookData.orderId || webhookData.gelatoOrderId || orderIdentifier,
      trackingNumber: webhookData.trackingNumber || webhookData.tracking?.number,
      trackingUrl: webhookData.trackingUrl || webhookData.tracking?.url
    };

    // Add additional metadata from webhook
    if (webhookData.metadata) {
      updateData.metadata = {
        ...order.metadata,
        ...webhookData.metadata,
        lastWebhookUpdate: new Date().toISOString()
      };
    }

    // Add shipping information if available
    if (webhookData.shipping) {
      updateData.shipping = webhookData.shipping;
    }

    // Add estimated delivery date if available
    if (webhookData.estimatedDelivery) {
      updateData.estimatedDelivery = webhookData.estimatedDelivery;
    }

    // Update order status
    await order.updateStatus(newStatus, updateData);

    console.log(`✅ Order ${order.orderNumber} status updated to: ${newStatus}`);
    if (updateData.trackingNumber) {
      console.log(`   Tracking: ${updateData.trackingNumber}`);
    }

    // Send success response
    res.json({
      success: true,
      message: 'Webhook processed successfully',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        gelatoOrderId: order.gelatoOrderId,
        status: newStatus,
        trackingNumber: updateData.trackingNumber,
        processedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process webhook',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper function to validate Gelato webhook payload
function validateGelatoWebhookPayload(data) {
  const errors = [];

  // Check if data is an object
  if (!data || typeof data !== 'object') {
    errors.push('Webhook payload must be a valid JSON object');
    return { isValid: false, errors };
  }

  // Check for required fields (at least one identifier)
  const hasOrderId = data.orderId || data.gelatoOrderId || data.id;
  const hasOrderNumber = data.orderNumber || data.order_number;
  const hasStatus = data.status;

  if (!hasOrderId && !hasOrderNumber) {
    errors.push('Webhook payload must contain orderId, gelatoOrderId, id, or orderNumber');
  }

  if (!hasStatus) {
    errors.push('Webhook payload must contain status field');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Helper function to extract order identifier from webhook data
function extractOrderIdentifier(data) {
  return data.orderId || 
         data.gelatoOrderId || 
         data.id || 
         data.orderNumber || 
         data.order_number;
}

// Helper function to map Gelato status to internal status
function mapGelatoStatus(gelatoStatus) {
  const statusMapping = {
    // Gelato statuses -> Internal statuses
    'pending': 'pending',
    'processing': 'processing',
    'in_production': 'in_production',
    'production': 'in_production',
    'shipped': 'shipped',
    'delivered': 'delivered',
    'cancelled': 'cancelled',
    'canceled': 'cancelled',
    'failed': 'failed',
    'error': 'failed',
    'completed': 'delivered',
    'fulfilled': 'delivered'
  };

  return statusMapping[gelatoStatus?.toLowerCase()] || null;
}

// GET /webhook/test - Test webhook endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Webhook endpoint is working',
    timestamp: new Date().toISOString()
  });
});

// POST /webhook/test - Test webhook with sample Gelato payloads
router.post('/test', async (req, res) => {
  try {
    const { scenario = 'shipped' } = req.body;

    // Sample Gelato webhook payloads for different scenarios
    const testScenarios = {
      processing: {
        orderId: 'gelato-order-12345',
        status: 'processing',
        metadata: {
          test: true,
          scenario: 'processing',
          timestamp: new Date().toISOString()
        }
      },
      in_production: {
        orderId: 'gelato-order-12345',
        status: 'in_production',
        metadata: {
          test: true,
          scenario: 'in_production',
          timestamp: new Date().toISOString()
        }
      },
      shipped: {
        orderId: 'gelato-order-12345',
        status: 'shipped',
        trackingNumber: 'TRK123456789',
        trackingUrl: 'https://tracking.gelato.com/TRK123456789',
        shipping: {
          carrier: 'DHL',
          service: 'Express',
          estimatedDelivery: '2024-01-20T10:00:00Z'
        },
        metadata: {
          test: true,
          scenario: 'shipped',
          timestamp: new Date().toISOString()
        }
      },
      delivered: {
        orderId: 'gelato-order-12345',
        status: 'delivered',
        trackingNumber: 'TRK123456789',
        trackingUrl: 'https://tracking.gelato.com/TRK123456789',
        deliveredAt: '2024-01-18T14:30:00Z',
        metadata: {
          test: true,
          scenario: 'delivered',
          timestamp: new Date().toISOString()
        }
      },
      cancelled: {
        orderId: 'gelato-order-12345',
        status: 'cancelled',
        reason: 'Customer request',
        metadata: {
          test: true,
          scenario: 'cancelled',
          timestamp: new Date().toISOString()
        }
      }
    };

    const testData = testScenarios[scenario] || testScenarios.shipped;
    console.log(`Processing test webhook scenario: ${scenario}`, testData);

    // Find a test order or create one for testing
    let order = await Order.findOne({ gelatoOrderId: 'gelato-order-12345' });
    
    if (!order) {
      // Create a test order if none exists
      order = new Order({
        orderNumber: 'TEST-ORDER-001',
        customer: {
          firstName: 'Test',
          lastName: 'Customer',
          email: 'test@example.com',
          phone: '123-456-7890',
          address: '123 Test St',
          city: 'Test City',
          postalCode: '12345',
          country: 'US'
        },
        items: [{
          productId: new require('mongoose').Types.ObjectId(),
          gelatoProductId: 'gelato-tshirt-001',
          name: 'Test T-Shirt',
          price: 24.99,
          quantity: 1,
          selectedOptions: { size: 'M', color: 'Blue' },
          image: 'https://via.placeholder.com/400x400'
        }],
        totals: {
          subtotal: 24.99,
          shipping: 5.99,
          tax: 2.48,
          total: 33.46
        },
        shippingAddress: {
          firstName: 'Test',
          lastName: 'Customer',
          email: 'test@example.com',
          phone: '123-456-7890',
          address: '123 Test St',
          city: 'Test City',
          postalCode: '12345',
          country: 'US'
        },
        gelatoOrderId: 'gelato-order-12345',
        status: 'sent_to_gelato'
      });
      
      await order.save();
      console.log('Created test order for webhook testing');
    }

    // Process the test webhook using the main webhook handler logic
    const newStatus = mapGelatoStatus(testData.status);
    const updateData = {
      orderId: testData.orderId,
      trackingNumber: testData.trackingNumber,
      trackingUrl: testData.trackingUrl,
      metadata: {
        ...order.metadata,
        ...testData.metadata,
        lastWebhookUpdate: new Date().toISOString()
      }
    };

    if (testData.shipping) {
      updateData.shipping = testData.shipping;
    }

    if (testData.deliveredAt) {
      updateData.deliveredAt = testData.deliveredAt;
    }

    await order.updateStatus(newStatus, updateData);

    res.json({
      success: true,
      message: `Test webhook scenario '${scenario}' processed successfully`,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        gelatoOrderId: order.gelatoOrderId,
        oldStatus: order.status,
        newStatus: newStatus,
        scenario: scenario,
        testData: testData,
        processedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process test webhook',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
