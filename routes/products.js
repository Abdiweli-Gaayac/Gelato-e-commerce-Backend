// const express = require('express');
// const router = express.Router();
// const Product = require('../models/Product');

// // GET /products - Get all products with optional filtering and pagination
// router.get('/', async (req, res) => {
//   try {
//     const {
//       category,
//       search,
//       sortBy = 'createdAt',
//       sortOrder = 'desc',
//       page = 1,
//       limit = 20,
//       minPrice,
//       maxPrice,
//       isNew,
//       isSale
//     } = req.query;

//     // Build query
//     const query = { isActive: true };

//     // Category filter
//     if (category && category !== 'all') {
//       query.category = category;
//     }

//     // Search filter
//     if (search) {
//       query.$text = { $search: search };
//     }

//     // Price range filter
//     if (minPrice || maxPrice) {
//       query.basePrice = {};
//       if (minPrice) query.basePrice.$gte = parseFloat(minPrice);
//       if (maxPrice) query.basePrice.$lte = parseFloat(maxPrice);
//     }

//     // New/Sale filters
//     if (isNew === 'true') {
//       query.isNew = true;
//     }
//     if (isSale === 'true') {
//       query.isSale = true;
//     }

//     // Build sort object
//     const sort = {};
//     if (search && sortBy === 'relevance') {
//       sort.score = { $meta: 'textScore' };
//     } else {
//       sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
//     }

//     // Pagination
//     const skip = (parseInt(page) - 1) * parseInt(limit);

//     // Execute query
//     const [products, total] = await Promise.all([
//       Product.find(query)
//         .sort(sort)
//         .skip(skip)
//         .limit(parseInt(limit))
//         .lean(),
//       Product.countDocuments(query)
//     ]);

//     // Calculate pagination info
//     const totalPages = Math.ceil(total / parseInt(limit));
//     const hasNextPage = parseInt(page) < totalPages;
//     const hasPrevPage = parseInt(page) > 1;

//     res.json({
//       success: true,
//       data: products,
//       pagination: {
//         currentPage: parseInt(page),
//         totalPages,
//         totalItems: total,
//         itemsPerPage: parseInt(limit),
//         hasNextPage,
//         hasPrevPage
//       }
//     });

//   } catch (error) {
//     console.error('Error fetching products:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch products',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// });

// // GET /products/:id - Get single product by ID
// router.get('/:id', async (req, res) => {
//   try {
//     const product = await Product.findById(req.params.id);

//     if (!product) {
//       return res.status(404).json({
//         success: false,
//         message: 'Product not found'
//       });
//     }

//     if (!product.isActive) {
//       return res.status(404).json({
//         success: false,
//         message: 'Product not available'
//       });
//     }

//     res.json({
//       success: true,
//       data: product
//     });

//   } catch (error) {
//     console.error('Error fetching product:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch product',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// });

// // GET /products/category/:category - Get products by category
// router.get('/category/:category', async (req, res) => {
//   try {
//     const { category } = req.params;
//     const { limit = 20 } = req.query;

//     const products = await Product.getByCategory(category)
//       .limit(parseInt(limit))
//       .lean();

//     res.json({
//       success: true,
//       data: products
//     });

//   } catch (error) {
//     console.error('Error fetching products by category:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch products by category',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// });

// // GET /products/search/:query - Search products
// router.get('/search/:query', async (req, res) => {
//   try {
//     const { query } = req.params;
//     const { limit = 20 } = req.query;

//     const products = await Product.search(query)
//       .limit(parseInt(limit))
//       .lean();

//     res.json({
//       success: true,
//       data: products
//     });

//   } catch (error) {
//     console.error('Error searching products:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to search products',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// });

// module.exports = router;







// ............................................
const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

const GELATO_API_KEY = process.env.GELATO_API_KEY;
const GELATO_API_URL = process.env.GELATO_API_URL || 'https://api.gelato.com/v4';

// Helper function to fetch from Gelato API
async function fetchGelato(endpoint) {
  // Check if API key is configured
  if (!GELATO_API_KEY || GELATO_API_KEY === 'demo-api-key-for-testing') {
    console.log('Gelato API key not configured, returning demo data');
    return {
      success: true,
      data: getDemoProducts()
    };
  }

  try {
    const response = await fetch(`${GELATO_API_URL}${endpoint}`, {
      headers: {
        'X-API-KEY': GELATO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Gelato-Ecommerce-Backend/1.0.0'
      }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('Gelato API error:', data.message || 'Unknown error');
      // Return demo data if API fails
      return {
        success: true,
        data: getDemoProducts()
      };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Gelato API error:', error.message);
    // Return demo data if request fails
    return {
      success: true,
      data: getDemoProducts()
    };
  }
}

// Demo products for testing when Gelato API is not available
function getDemoProducts() {
  return [
    {
      id: 'demo-1',
      name: 'Premium Cotton T-Shirt',
      description: 'High-quality cotton t-shirt perfect for custom designs',
      price: 19.99,
      originalPrice: 24.99,
      category: 'apparel',
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
      isNew: true,
      isSale: true,
      rating: 4.5,
      reviews: 128
    },
    {
      id: 'demo-2',
      name: 'Canvas Art Print',
      description: 'Beautiful canvas print for your walls',
      price: 29.99,
      category: 'prints',
      image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=400&fit=crop',
      isNew: false,
      isSale: false,
      rating: 4.8,
      reviews: 89
    },
    {
      id: 'demo-3',
      name: 'Ceramic Coffee Mug',
      description: 'Durable ceramic mug for your morning coffee',
      price: 12.99,
      category: 'home',
      image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop',
      isNew: false,
      isSale: true,
      rating: 4.2,
      reviews: 156
    },
    {
      id: 'demo-4',
      name: 'Phone Case',
      description: 'Protective phone case with custom designs',
      price: 15.99,
      originalPrice: 19.99,
      category: 'accessories',
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop',
      isNew: true,
      isSale: true,
      rating: 4.6,
      reviews: 203
    },
    {
      id: 'demo-5',
      name: 'Hoodie',
      description: 'Comfortable hoodie for casual wear',
      price: 39.99,
      category: 'apparel',
      image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop',
      isNew: false,
      isSale: false,
      rating: 4.7,
      reviews: 94
    },
    {
      id: 'demo-6',
      name: 'Poster Print',
      description: 'High-quality poster for your room',
      price: 9.99,
      category: 'prints',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop',
      isNew: false,
      isSale: true,
      rating: 4.3,
      reviews: 67
    },
    {
      id: 'demo-7',
      name: 'Laptop Sticker',
      description: 'Durable vinyl sticker for your laptop',
      price: 4.99,
      category: 'accessories',
      image: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=400&fit=crop',
      isNew: true,
      isSale: false,
      rating: 4.1,
      reviews: 45
    },
    {
      id: 'demo-8',
      name: 'Tote Bag',
      description: 'Eco-friendly canvas tote bag',
      price: 14.99,
      originalPrice: 18.99,
      category: 'accessories',
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
      isNew: false,
      isSale: true,
      rating: 4.4,
      reviews: 112
    },
    {
      id: 'demo-9',
      name: 'Wall Clock',
      description: 'Modern wall clock with custom design',
      price: 24.99,
      category: 'home',
      image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=400&fit=crop',
      isNew: false,
      isSale: false,
      rating: 4.7,
      reviews: 89
    },
    {
      id: 'demo-10',
      name: 'Baseball Cap',
      description: 'Adjustable baseball cap',
      price: 16.99,
      category: 'apparel',
      image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&h=400&fit=crop',
      isNew: true,
      isSale: false,
      rating: 4.5,
      reviews: 76
    },
    {
      id: 'demo-11',
      name: 'Water Bottle',
      description: 'Insulated stainless steel water bottle',
      price: 22.99,
      originalPrice: 28.99,
      category: 'accessories',
      image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop',
      isNew: false,
      isSale: true,
      rating: 4.8,
      reviews: 203
    },
    {
      id: 'demo-12',
      name: 'Throw Pillow',
      description: 'Soft decorative throw pillow',
      price: 18.99,
      category: 'home',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop',
      isNew: false,
      isSale: false,
      rating: 4.6,
      reviews: 134
    }
  ];
}

// ==========================
// GET /api/products
// Fetch all products
// ==========================
router.get('/', async (req, res) => {
  const { page = 1, limit = 20 } = req.query; // pagination support
  const response = await fetchGelato('/products');

  if (!response.success) {
    return res.status(response.statusCode || 500).json({ 
      success: false,
      message: response.message 
    });
  }

  // Simple pagination
  const start = (page - 1) * limit;
  const end = start + Number(limit);
  const paginated = response.data.slice(start, end);

  res.json({ success: true, data: paginated });
});

// ==========================
// GET /api/products/:id
// Fetch single product by ID (filter locally)
// ==========================
router.get('/:id', async (req, res) => {
  const response = await fetchGelato('/products');

  if (!response.success) {
    return res.status(response.statusCode || 500).json({ message: response.message });
  }

  const product = response.data.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  res.json({ success: true, data: product });
});

// ==========================
// GET /api/products/search/:query
// Search products locally
// ==========================
router.get('/search/:query', async (req, res) => {
  const response = await fetchGelato('/products');

  if (!response.success) {
    return res.status(response.statusCode || 500).json({ message: response.message });
  }

  const query = req.params.query.toLowerCase();
  const filtered = response.data.filter(
    p => p.name.toLowerCase().includes(query) || (p.description && p.description.toLowerCase().includes(query))
  );

  res.json({ success: true, data: filtered });
});

// ==========================
// GET /api/products/category/:category
// Filter products by category locally
// ==========================
router.get('/category/:category', async (req, res) => {
  const response = await fetchGelato('/products');

  if (!response.success) {
    return res.status(response.statusCode || 500).json({ message: response.message });
  }

  const category = req.params.category.toLowerCase();
  const filtered = response.data.filter(p => p.category && p.category.toLowerCase() === category);

  res.json({ success: true, data: filtered });
});

module.exports = router;


