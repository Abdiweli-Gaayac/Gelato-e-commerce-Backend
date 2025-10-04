const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// GET /orders/:id - Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find order by MongoDB ObjectId or order number
    const order = await Order.findOne({
      $or: [
        { _id: id },
        { orderNumber: id }
      ]
    }).populate('items.productId');
    
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

// GET /orders/customer/:email - Get orders by customer email
router.get('/customer/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { limit = 10, page = 1 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [orders, total] = await Promise.all([
      Order.find({ 'customer.email': email })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('items.productId')
        .lean(),
      Order.countDocuments({ 'customer.email': email })
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
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

// GET /orders - Get all orders (admin only)
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      limit = 20, 
      page = 1, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;

    // Build query
    const query = {};
    if (status) {
      query.status = status;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('items.productId')
        .lean(),
      Order.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;



