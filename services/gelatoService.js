require('dotenv').config();
const fetch = require('node-fetch');

class GelatoService {
  constructor() {
    this.apiKey = process.env.GELATO_API_KEY;
    // Align with Gelato docs: default to order.gelatoapis.com unless overridden
    this.baseURL = process.env.GELATO_API_URL || 'https://order.gelatoapis.com';
    this.timeout = 30000; // 30 seconds
    this.fallbackProductId = process.env.GELATO_FALLBACK_PRODUCT_ID || null;

    if (!this.apiKey) {
      console.warn('GELATO_API_KEY not found in environment variables');
    }
  }

  // Get default headers for API requests
  getDefaultHeaders() {
    return {
      'X-API-KEY': this.apiKey,          // Correct header for Gelato
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Gelato-Ecommerce-Backend/1.0.0'
    };
  }

  // Make API request with node-fetch
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      timeout: this.timeout,
      headers: this.getDefaultHeaders(),
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = data?.message || data?.error || response.statusText;
        console.error('Gelato API HTTP error', response.status, message, data);
        return {
          success: false,
          message,
          status: response.status,
          error: data
        };
      }

      return {
        success: true,
        data,
        status: response.status
      };
    } catch (error) {
      console.error(`Gelato API request failed: ${url}`, error.message);
      return {
        success: false,
        message: error.message,
        status: error.status || 500
      };
    }
  }

  // Forward order to Gelato API
  async forwardOrder(order) {
    try {
      if (!this.apiKey) throw new Error('Gelato API key not configured');

      // Align to Gelato expectation: top-level order fields (no extra wrapper)
      const gelatoOrderData = {
        orderReferenceId: order.orderNumber,
        customer: {
          firstName: order.customer.firstName,
          lastName: order.customer.lastName,
          email: order.customer.email,
          phone: order.customer.phone
        },
        shippingAddress: {
          firstName: order.shippingAddress.firstName,
          lastName: order.shippingAddress.lastName,
          address: order.shippingAddress.address,
          city: order.shippingAddress.city,
          postalCode: order.shippingAddress.postalCode,
          country: order.shippingAddress.country
        },
        currency: 'USD',
        items: order.items.map((item, index) => ({
          // Required by Gelato: unique reference per item in the order
          itemReferenceId: `${order.orderNumber}-ITEM-${index + 1}`,
          // Use item.gelatoProductId if valid, otherwise allow a configured fallback product id
          productId: item.gelatoProductId || this.fallbackProductId,
          quantity: item.quantity,
          options: item.selectedOptions || {},
          metadata: {
            ...(item.productId ? { originalProductId: item.productId.toString() } : {}),
            productName: item.name,
            unitPrice: item.price
          }
        })),
        metadata: {
          originalOrderId: order._id.toString(),
          orderNumber: order.orderNumber,
          total: order.totals.total,
          subtotal: order.totals.subtotal,
          shipping: order.totals.shipping,
          tax: order.totals.tax
        }
      };

      console.log('Sending order to Gelato API:', JSON.stringify(gelatoOrderData, null, 2));

      // Gelato Orders API uses versioned endpoints
      const response = await this.makeRequest('/v4/orders', {
        method: 'POST',
        body: JSON.stringify(gelatoOrderData)
      });

      if (response.success) {
        return {
          success: true,
          data: {
            gelatoOrderId: response.data.order?.id || response.data.id,
            trackingNumber: response.data.order?.trackingNumber,
            trackingUrl: response.data.order?.trackingUrl,
            status: response.data.order?.status || 'pending',
            gelatoResponse: response.data
          }
        };
      } else {
        return {
          success: false,
          message: response.message,
          statusCode: response.status
        };
      }
    } catch (error) {
      console.error('Gelato API error:', error.message);
      return {
        success: false,
        message: error.message,
        statusCode: 500
      };
    }
  }

  // Get order status from Gelato
  async getOrderStatus(gelatoOrderId) {
    try {
      if (!this.apiKey) throw new Error('Gelato API key not configured');

      const response = await this.makeRequest(`/v4/orders/${gelatoOrderId}`, { method: 'GET' });

      if (response.success) {
        return {
          success: true,
          data: response.data.order || response.data
        };
      } else {
        return {
          success: false,
          message: response.message,
          statusCode: response.status
        };
      }
    } catch (error) {
      console.error('Gelato API error:', error.message);
      return {
        success: false,
        message: error.message,
        statusCode: 500
      };
    }
  }

  // Get available products from Gelato
  async getProducts() {
    try {
      if (!this.apiKey) throw new Error('Gelato API key not configured');

      const response = await this.makeRequest('/products', { method: 'GET' });

      if (response.success) {
        return {
          success: true,
          data: response.data.products || response.data
        };
      } else {
        return {
          success: false,
          message: response.message,
          statusCode: response.status
        };
      }
    } catch (error) {
      console.error('Gelato API error:', error.message);
      return {
        success: false,
        message: error.message,
        statusCode: 500
      };
    }
  }

  // Validate webhook signature (optional)
  validateWebhookSignature(payload, signature, secret) {
    if (!secret) {
      console.warn('Webhook secret not configured');
      return true;
    }

    // Add your signature validation logic here (e.g., HMAC-SHA256)
    return true;
  }
}

// Create singleton instance
const gelatoService = new GelatoService();

// Export functions for routes
const forwardToGelato = async (order) => await gelatoService.forwardOrder(order);
const getGelatoOrderStatus = async (gelatoOrderId) => await gelatoService.getOrderStatus(gelatoOrderId);
const getGelatoProducts = async () => await gelatoService.getProducts();
const validateGelatoWebhook = (payload, signature, secret) => gelatoService.validateWebhookSignature(payload, signature, secret);

module.exports = {
  gelatoService,
  forwardToGelato,
  getGelatoOrderStatus,
  getGelatoProducts,
  validateGelatoWebhook
};










// newly updated gelatoService.js

// backend/services/gelatoService.js









// require('dotenv').config();
// const fetch = require('node-fetch');

// class GelatoService {
//   constructor() {
//     this.apiKey = process.env.GELATO_API_KEY;
//     this.baseUrl = process.env.GELATO_API_URL || 'https://api.gelato.com';
//   }

//   getDefaultHeaders() {
//     return {
//       'X-API-KEY': this.apiKey,
//       'Content-Type': 'application/json',
//       'Accept': 'application/json',
//       'User-Agent': 'Gelato-Ecommerce-Backend/1.0.0'
//     };
//   }

//   async request(endpoint, options = {}) {
//     const url = `${this.baseUrl}${endpoint}`;
//     try {
//       const response = await fetch(url, {
//         ...options,
//         headers: {
//           ...this.getDefaultHeaders(),
//           ...(options.headers || {})
//         }
//       });

//       const data = await response.json().catch(() => ({}));

//       if (!response.ok) {
//         return {
//           success: false,
//           statusCode: response.status,
//           message: data.message || 'Gelato API request failed',
//           error: data
//         };
//       }

//       return {
//         success: true,
//         statusCode: response.status,
//         data
//       };
//     } catch (error) {
//       console.error('Gelato API error:', error.message);
//       return {
//         success: false,
//         statusCode: 500,
//         message: 'Request failed',
//         error: error.message
//       };
//     }
//   }

//   async getProducts() {
//     return this.request('/v4/products');
//   }

//   async getCategories() {
//     return this.request('/v4/categories');
//   }

//   async getProductTemplates() {
//     return this.request('/v4/product-templates');
//   }
// }

// const gelatoService = new GelatoService();

// module.exports = {
//   getGelatoProducts: () => gelatoService.getProducts(),
//   getGelatoCategories: () => gelatoService.getCategories(),
//   getGelatoTemplates: () => gelatoService.getProductTemplates()
// };
