const mongoose = require('mongoose');
const Order = require('../models/Order');
const fetch = require('node-fetch');
require('dotenv').config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

async function testWebhook() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gelato-ecommerce');
    console.log('✅ Connected to MongoDB');

    // Create a test order first
    const testOrder = new Order({
      orderNumber: 'WEBHOOK-TEST-001',
      customer: {
        firstName: 'Webhook',
        lastName: 'Test',
        email: 'webhook.test@example.com',
        phone: '+1-555-987-6543',
        address: '456 Test Avenue',
        city: 'Test City',
        postalCode: '54321',
        country: 'US'
      },
      items: [{
        productId: new mongoose.Types.ObjectId(),
        gelatoProductId: 'gelato-mug-001',
        name: 'Test Mug',
        price: 16.99,
        quantity: 2,
        selectedOptions: { size: '15oz', color: 'White' },
        image: 'https://via.placeholder.com/400x400'
      }],
      totals: {
        subtotal: 33.98,
        shipping: 5.99,
        tax: 3.20,
        total: 43.17
      },
      shippingAddress: {
        firstName: 'Webhook',
        lastName: 'Test',
        email: 'webhook.test@example.com',
        phone: '+1-555-987-6543',
        address: '456 Test Avenue',
        city: 'Test City',
        postalCode: '54321',
        country: 'US'
      },
      gelatoOrderId: 'webhook-test-order-123',
      status: 'sent_to_gelato'
    });

    await testOrder.save();
    console.log(`📋 Created test order: ${testOrder.orderNumber} (${testOrder.gelatoOrderId})`);

    // Test webhook scenarios
    const scenarios = [
      {
        name: 'Processing',
        payload: {
          orderId: 'webhook-test-order-123',
          status: 'processing',
          metadata: {
            test: true,
            scenario: 'processing'
          }
        }
      },
      {
        name: 'In Production',
        payload: {
          orderId: 'webhook-test-order-123',
          status: 'in_production',
          metadata: {
            test: true,
            scenario: 'in_production'
          }
        }
      },
      {
        name: 'Shipped',
        payload: {
          orderId: 'webhook-test-order-123',
          status: 'shipped',
          trackingNumber: 'WEBHOOK123456789',
          trackingUrl: 'https://tracking.example.com/WEBHOOK123456789',
          shipping: {
            carrier: 'FedEx',
            service: 'Ground',
            estimatedDelivery: '2024-01-25T12:00:00Z'
          },
          metadata: {
            test: true,
            scenario: 'shipped'
          }
        }
      },
      {
        name: 'Delivered',
        payload: {
          orderId: 'webhook-test-order-123',
          status: 'delivered',
          trackingNumber: 'WEBHOOK123456789',
          trackingUrl: 'https://tracking.example.com/WEBHOOK123456789',
          deliveredAt: '2024-01-23T15:30:00Z',
          metadata: {
            test: true,
            scenario: 'delivered'
          }
        }
      }
    ];

    console.log('\n🧪 Testing webhook scenarios...\n');

    for (const scenario of scenarios) {
      console.log(`Testing scenario: ${scenario.name}`);
      console.log('Payload:', JSON.stringify(scenario.payload, null, 2));

      try {
        const response = await fetch(`${BASE_URL}/api/webhook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(scenario.payload)
        });

        const result = await response.json();
        
        if (response.ok && result.success) {
          console.log(`✅ ${scenario.name} webhook processed successfully`);
          console.log(`   Order Status: ${result.data.status}`);
          if (result.data.trackingNumber) {
            console.log(`   Tracking: ${result.data.trackingNumber}`);
          }
        } else {
          console.log(`❌ ${scenario.name} webhook failed`);
          console.log(`   Error: ${result.message}`);
        }
      } catch (error) {
        console.log(`❌ ${scenario.name} webhook error: ${error.message}`);
      }

      console.log(''); // Empty line for readability
    }

    // Test invalid webhook payloads
    console.log('🧪 Testing invalid webhook payloads...\n');

    const invalidScenarios = [
      {
        name: 'Missing Order ID',
        payload: {
          status: 'shipped'
        }
      },
      {
        name: 'Missing Status',
        payload: {
          orderId: 'webhook-test-order-123'
        }
      },
      {
        name: 'Invalid Status',
        payload: {
          orderId: 'webhook-test-order-123',
          status: 'invalid_status'
        }
      },
      {
        name: 'Non-existent Order',
        payload: {
          orderId: 'non-existent-order-123',
          status: 'shipped'
        }
      }
    ];

    for (const scenario of invalidScenarios) {
      console.log(`Testing invalid scenario: ${scenario.name}`);

      try {
        const response = await fetch(`${BASE_URL}/api/webhook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(scenario.payload)
        });

        const result = await response.json();
        
        if (!response.ok || !result.success) {
          console.log(`✅ Correctly rejected invalid payload: ${result.message}`);
        } else {
          console.log(`❌ Should have rejected invalid payload`);
        }
      } catch (error) {
        console.log(`❌ Error testing invalid payload: ${error.message}`);
      }

      console.log(''); // Empty line for readability
    }

    // Test webhook endpoint health
    console.log('🧪 Testing webhook endpoint health...\n');

    try {
      const response = await fetch(`${BASE_URL}/api/webhook/test`);
      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log('✅ Webhook endpoint is healthy');
      } else {
        console.log('❌ Webhook endpoint health check failed');
      }
    } catch (error) {
      console.log(`❌ Webhook endpoint health check error: ${error.message}`);
    }

    // Clean up test order
    await Order.deleteOne({ _id: testOrder._id });
    console.log('\n🧹 Cleaned up test order');

    console.log('\n✅ Webhook testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testWebhook();
}

module.exports = { testWebhook };



