const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { forwardToGelato, getGelatoOrderStatus } = require('../services/gelatoService');
require('dotenv').config();

async function testGelatoIntegration() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gelato-ecommerce');
    console.log('✅ Connected to MongoDB');

    // Check if Gelato API key is configured
    if (!process.env.GELATO_API_KEY) {
      console.log('⚠️  GELATO_API_KEY not found in environment variables');
      console.log('   This test will simulate the API call without actually sending to Gelato');
    } else {
      console.log('✅ Gelato API key found');
    }

    // Find a sample product
    const sampleProduct = await Product.findOne({ isActive: true });
    if (!sampleProduct) {
      console.log('❌ No active products found. Please run the seed script first.');
      process.exit(1);
    }

    console.log(`📦 Using sample product: ${sampleProduct.name} (${sampleProduct.gelatoProductId})`);

    // Create a test order
    const testOrder = new Order({
      orderNumber: `TEST-${Date.now()}`,
      customer: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-123-4567',
        address: '123 Test Street',
        city: 'Test City',
        postalCode: '12345',
        country: 'US'
      },
      items: [{
        productId: sampleProduct._id,
        gelatoProductId: sampleProduct.gelatoProductId,
        name: sampleProduct.name,
        price: sampleProduct.basePrice,
        quantity: 1,
        selectedOptions: {
          size: 'M',
          color: 'Blue'
        },
        image: sampleProduct.images?.[0]?.url
      }],
      totals: {
        subtotal: sampleProduct.basePrice,
        shipping: 5.99,
        tax: (sampleProduct.basePrice * 0.08),
        total: sampleProduct.basePrice + 5.99 + (sampleProduct.basePrice * 0.08)
      },
      shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-123-4567',
        address: '123 Test Street',
        city: 'Test City',
        postalCode: '12345',
        country: 'US'
      },
      status: 'pending'
    });

    await testOrder.save();
    console.log(`📋 Created test order: ${testOrder.orderNumber}`);

    // Test forwarding order to Gelato
    console.log('\n🚀 Testing order forwarding to Gelato...');
    const gelatoResponse = await forwardToGelato(testOrder);

    if (gelatoResponse.success) {
      console.log('✅ Order successfully forwarded to Gelato!');
      console.log(`   Gelato Order ID: ${gelatoResponse.data.gelatoOrderId}`);
      console.log(`   Status: ${gelatoResponse.data.status}`);
      
      if (gelatoResponse.data.trackingNumber) {
        console.log(`   Tracking Number: ${gelatoResponse.data.trackingNumber}`);
      }
      if (gelatoResponse.data.trackingUrl) {
        console.log(`   Tracking URL: ${gelatoResponse.data.trackingUrl}`);
      }

      // Update the test order with Gelato data
      await testOrder.updateStatus('sent_to_gelato', {
        orderId: gelatoResponse.data.gelatoOrderId,
        trackingNumber: gelatoResponse.data.trackingNumber,
        trackingUrl: gelatoResponse.data.trackingUrl
      });

      console.log('✅ Test order updated with Gelato data');

      // Test getting order status from Gelato
      console.log('\n📊 Testing order status retrieval from Gelato...');
      const statusResponse = await getGelatoOrderStatus(gelatoResponse.data.gelatoOrderId);

      if (statusResponse.success) {
        console.log('✅ Successfully retrieved order status from Gelato');
        console.log(`   Current Status: ${statusResponse.data.status}`);
      } else {
        console.log('⚠️  Failed to retrieve order status from Gelato');
        console.log(`   Error: ${statusResponse.message}`);
      }

    } else {
      console.log('❌ Failed to forward order to Gelato');
      console.log(`   Error: ${gelatoResponse.message}`);
      console.log(`   Status Code: ${gelatoResponse.statusCode}`);
    }

    // Clean up test order
    await Order.deleteOne({ _id: testOrder._id });
    console.log('\n🧹 Cleaned up test order');

    console.log('\n✅ Gelato integration test completed!');

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
  testGelatoIntegration();
}

module.exports = { testGelatoIntegration };







