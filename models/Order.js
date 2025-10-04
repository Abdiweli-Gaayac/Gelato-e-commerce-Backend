const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  gelatoProductId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  selectedOptions: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  image: String
}, { _id: false });

const customerSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  postalCode: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  customer: {
    type: customerSchema,
    required: true
  },
  items: [orderItemSchema],
  totals: {
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    shipping: {
      type: Number,
      required: true,
      min: 0
    },
    tax: {
      type: Number,
      required: true,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    }
  },
  status: {
    type: String,
    enum: [
      'pending',
      'processing',
      'sent_to_gelato',
      'in_production',
      'shipped',
      'delivered',
      'cancelled',
      'failed'
    ],
    default: 'pending'
  },
  gelatoOrderId: {
    type: String,
    sparse: true
  },
  gelatoTrackingNumber: String,
  gelatoTrackingUrl: String,
  shippingAddress: {
    type: customerSchema,
    required: true
  },
  notes: String,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ 'customer.email': 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ gelatoOrderId: 1 });

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

// Virtual for customer full name
orderSchema.virtual('customer.fullName').get(function() {
  return `${this.customer.firstName} ${this.customer.lastName}`;
});

// Virtual for total items count
orderSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Method to update status
orderSchema.methods.updateStatus = function(newStatus, gelatoData = {}) {
  this.status = newStatus;
  
  if (gelatoData.orderId) {
    this.gelatoOrderId = gelatoData.orderId;
  }
  
  if (gelatoData.trackingNumber) {
    this.gelatoTrackingNumber = gelatoData.trackingNumber;
  }
  
  if (gelatoData.trackingUrl) {
    this.gelatoTrackingUrl = gelatoData.trackingUrl;
  }
  
  return this.save();
};

// Static method to get orders by status
orderSchema.statics.getByStatus = function(status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

// Static method to get orders by customer email
orderSchema.statics.getByCustomer = function(email) {
  return this.find({ 'customer.email': email }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Order', orderSchema);



