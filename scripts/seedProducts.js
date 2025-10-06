const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

const sampleProducts = [
  {
    gelatoProductId: 'gelato-tshirt-001',
    name: 'Custom T-Shirt',
    description: 'High-quality cotton t-shirt perfect for custom designs. Available in multiple colors and sizes.',
    category: 'apparel',
    subcategory: 't-shirts',
    basePrice: 24.99,
    originalPrice: 29.99,
    currency: 'USD',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
        alt: 'Custom T-Shirt'
      }
    ],
    variants: [
      {
        name: 'Size',
        options: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
      },
      {
        name: 'Color',
        options: ['White', 'Black', 'Navy', 'Gray', 'Red']
      }
    ],
    specifications: {
      dimensions: 'Standard t-shirt size',
      weight: '180g',
      materials: ['100% Cotton']
    },
    isActive: true,
    isNew: true,
    isSale: true,
    tags: ['t-shirt', 'cotton', 'custom', 'apparel'],
    rating: 4.8,
    reviews: 124
  },
  {
    gelatoProductId: 'gelato-mug-001',
    name: 'Premium Ceramic Mug',
    description: 'Beautiful ceramic mug perfect for coffee, tea, or hot chocolate. Dishwasher safe and microwave safe.',
    category: 'home',
    subcategory: 'drinkware',
    basePrice: 16.99,
    currency: 'USD',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?w=400&h=400&fit=crop',
        alt: 'Premium Ceramic Mug'
      }
    ],
    variants: [
      {
        name: 'Size',
        options: ['11oz', '15oz']
      },
      {
        name: 'Color',
        options: ['White', 'Black', 'Blue']
      }
    ],
    specifications: {
      dimensions: '11oz or 15oz capacity',
      weight: '300g',
      materials: ['Ceramic']
    },
    isActive: true,
    isNew: false,
    isSale: false,
    tags: ['mug', 'ceramic', 'coffee', 'home'],
    rating: 4.9,
    reviews: 89
  },
  {
    gelatoProductId: 'gelato-canvas-001',
    name: 'Canvas Wall Art',
    description: 'High-quality canvas print perfect for displaying your favorite photos or artwork. Gallery-wrapped edges.',
    category: 'prints',
    subcategory: 'canvas',
    basePrice: 39.99,
    currency: 'USD',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=400&fit=crop',
        alt: 'Canvas Wall Art'
      }
    ],
    variants: [
      {
        name: 'Size',
        options: ['8x10', '12x16', '16x20', '20x24', '24x36']
      }
    ],
    specifications: {
      dimensions: 'Various sizes available',
      weight: '500g',
      materials: ['Canvas', 'Acrylic']
    },
    isActive: true,
    isNew: true,
    isSale: false,
    tags: ['canvas', 'art', 'print', 'wall'],
    rating: 4.7,
    reviews: 156
  },
  {
    gelatoProductId: 'gelato-phonecase-001',
    name: 'Phone Case',
    description: 'Durable phone case with custom design. Compatible with most smartphone models.',
    category: 'accessories',
    subcategory: 'phone-cases',
    basePrice: 19.99,
    originalPrice: 24.99,
    currency: 'USD',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400&h=400&fit=crop',
        alt: 'Phone Case'
      }
    ],
    variants: [
      {
        name: 'Model',
        options: ['iPhone 14', 'iPhone 13', 'Samsung Galaxy S23', 'Google Pixel 7']
      },
      {
        name: 'Type',
        options: ['Clear', 'Matte', 'Glossy']
      }
    ],
    specifications: {
      dimensions: 'Model-specific',
      weight: '50g',
      materials: ['TPU', 'Polycarbonate']
    },
    isActive: true,
    isNew: false,
    isSale: true,
    tags: ['phone', 'case', 'protection', 'accessories'],
    rating: 4.6,
    reviews: 203
  },
  {
    gelatoProductId: 'gelato-hoodie-001',
    name: 'Premium Hoodie',
    description: 'Comfortable and warm hoodie perfect for casual wear. Soft fleece interior and adjustable drawstring hood.',
    category: 'apparel',
    subcategory: 'hoodies',
    basePrice: 49.99,
    currency: 'USD',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop',
        alt: 'Premium Hoodie'
      }
    ],
    variants: [
      {
        name: 'Size',
        options: ['S', 'M', 'L', 'XL', 'XXL']
      },
      {
        name: 'Color',
        options: ['Black', 'Gray', 'Navy', 'White']
      }
    ],
    specifications: {
      dimensions: 'Standard hoodie size',
      weight: '600g',
      materials: ['80% Cotton', '20% Polyester']
    },
    isActive: true,
    isNew: false,
    isSale: false,
    tags: ['hoodie', 'fleece', 'warm', 'casual'],
    rating: 4.5,
    reviews: 78
  },
  {
    gelatoProductId: 'gelato-poster-001',
    name: 'Poster Print',
    description: 'High-quality poster print on premium paper. Perfect for decorating your space.',
    category: 'prints',
    subcategory: 'posters',
    basePrice: 12.99,
    originalPrice: 16.99,
    currency: 'USD',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=400&fit=crop',
        alt: 'Poster Print'
      }
    ],
    variants: [
      {
        name: 'Size',
        options: ['8x10', '11x14', '16x20', '18x24']
      },
      {
        name: 'Paper',
        options: ['Matte', 'Glossy', 'Satin']
      }
    ],
    specifications: {
      dimensions: 'Various sizes available',
      weight: '100g',
      materials: ['Premium Paper']
    },
    isActive: true,
    isNew: false,
    isSale: true,
    tags: ['poster', 'print', 'paper', 'decoration'],
    rating: 4.4,
    reviews: 92
  },
  {
    gelatoProductId: 'gelato-totebag-001',
    name: 'Canvas Tote Bag',
    description: 'Eco-friendly canvas tote bag perfect for shopping, beach trips, or everyday use. Durable and washable.',
    category: 'accessories',
    subcategory: 'bags',
    basePrice: 18.99,
    currency: 'USD',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
        alt: 'Canvas Tote Bag'
      }
    ],
    variants: [
      {
        name: 'Size',
        options: ['Small', 'Medium', 'Large']
      },
      {
        name: 'Color',
        options: ['Natural', 'Black', 'Navy', 'Red']
      }
    ],
    specifications: {
      dimensions: '40cm x 35cm x 10cm',
      weight: '200g',
      materials: ['100% Cotton Canvas']
    },
    isActive: true,
    isNew: true,
    isSale: false,
    tags: ['tote', 'bag', 'canvas', 'eco-friendly'],
    rating: 4.3,
    reviews: 67
  },
  {
    gelatoProductId: 'gelato-pillow-001',
    name: 'Throw Pillow',
    description: 'Soft and comfortable throw pillow perfect for adding style to your home. Removable cover for easy cleaning.',
    category: 'home',
    subcategory: 'pillows',
    basePrice: 22.99,
    currency: 'USD',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop',
        alt: 'Throw Pillow'
      }
    ],
    variants: [
      {
        name: 'Size',
        options: ['16x16', '18x18', '20x20']
      },
      {
        name: 'Fill',
        options: ['Down', 'Polyester', 'Memory Foam']
      }
    ],
    specifications: {
      dimensions: 'Square pillow',
      weight: '400g',
      materials: ['Cotton Cover', 'Polyester Fill']
    },
    isActive: true,
    isNew: false,
    isSale: false,
    tags: ['pillow', 'throw', 'home', 'decor'],
    rating: 4.8,
    reviews: 134
  }
];

async function seedProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gelato-ecommerce');
    console.log('Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert sample products
    const insertedProducts = await Product.insertMany(sampleProducts);
    console.log(`Inserted ${insertedProducts.length} products`);

    // Display summary
    const categories = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    console.log('\nProducts by category:');
    categories.forEach(cat => {
      console.log(`- ${cat._id}: ${cat.count} products`);
    });

    console.log('\nSeeding completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedProducts();
}

module.exports = { seedProducts, sampleProducts };







