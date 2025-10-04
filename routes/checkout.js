const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { forwardToGelato } = require('../services/gelatoService');

// POST /checkout - Process checkout and create order
router.post('/', async (req, res) => {
  try {
    const { customer, items, totals } = req.body;

    // Validate required fields
    if (!customer || !items || !totals) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: customer, items, or totals'
      });
    }

    // Validate customer data
    const requiredCustomerFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'postalCode', 'country'];
    for (const field of requiredCustomerFields) {
      if (!customer[field]) {
        return res.status(400).json({
          success: false,
          message: `Missing required customer field: ${field}`
        });
      }
    }

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items must be a non-empty array'
      });
    }

    // Validate totals
    const requiredTotalFields = ['subtotal', 'shipping', 'tax', 'total'];
    for (const field of requiredTotalFields) {
      if (typeof totals[field] !== 'number' || totals[field] < 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid total field: ${field}`
        });
      }
    }

    // Process order items (using demo data since we're not using database products)
    const orderItems = [];
    for (const item of items) {
      // For demo purposes, we'll use the item data directly
      // In a real application, you'd validate against your product database
      orderItems.push({
        productId: item.id,
        gelatoProductId: item.id, // Using item ID as gelato ID for demo
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        selectedOptions: item.selectedOptions || {},
        image: item.image || null
      });
    }

    // Create order
    const order = new Order({
      customer,
      items: orderItems,
      totals,
      shippingAddress: customer, // Using customer address as shipping address
      status: 'pending'
    });

    await order.save();

    // For demo purposes, we'll simulate successful order processing
    // In a real application, you would integrate with Gelato or another print service
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update order status to completed for demo
      order.status = 'completed';
      order.statusHistory = order.statusHistory || [];
      order.statusHistory.push({
        status: 'completed',
        timestamp: new Date(),
        note: 'Order processed successfully (Demo Mode)'
      });
      await order.save();

      console.log(`Order ${order.orderNumber} processed successfully in demo mode`);

      res.status(201).json({
        success: true,
        message: 'Order created and processed successfully',
        data: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          status: 'completed',
          message: 'Your order has been placed successfully!'
        }
      });
    } catch (processingError) {
      console.error('Order processing error:', processingError);
      
      // Order created but processing failed
      order.status = 'failed';
      order.statusHistory = order.statusHistory || [];
      order.statusHistory.push({
        status: 'failed',
        timestamp: new Date(),
        note: 'Order processing failed: ' + processingError.message
      });
      await order.save();

      res.status(201).json({
        success: true,
        message: 'Order created but processing failed',
        data: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          status: 'failed',
          error: 'Order processing failed'
        }
      });
    }

  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process checkout',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /checkout/order/:orderNumber - Get order by order number
router.get('/order/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    
    const order = await Order.findOne({ orderNumber }).populate('items.productId');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /checkout/customer/:email - Get orders by customer email
router.get('/customer/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const orders = await Order.getByCustomer(email).populate('items.productId');
    
    res.json({
      success: true,
      data: orders
    });

  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
