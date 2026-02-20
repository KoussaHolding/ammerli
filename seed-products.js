const { Client } = require('pg');

// Database configuration (adjust if needed based on env)
const client = new Client({
  user: 'ammerli',
  host: 'localhost',
  database: 'ammerli',
  password: 'ammerli',
  port: 5432,
});

const products = [
  // Drinkable Water
  {
    name: 'Pack 6x1.5L (Drinkable)',
    description: 'Premium mineral water for daily consumption.',
    basePrice: 150,
    pricePerKm: 5,
    capacityLiters: 9,
    isActive: true
  },
  {
    name: '5L Jug (Drinkable)',
    description: 'Large bottle for home dispensers.',
    basePrice: 120,
    pricePerKm: 5,
    capacityLiters: 5,
    isActive: true
  },
  // Truck Water
  {
    name: 'Water Truck (1000L)',
    description: 'Standard domestic tank filling service.',
    basePrice: 1500,
    pricePerKm: 50,
    capacityLiters: 1000,
    isActive: true
  },
  {
    name: 'Large Cistern (3000L)',
    description: 'High capacity delivery for construction or large reservoirs.',
    basePrice: 4000,
    pricePerKm: 80,
    capacityLiters: 3000,
    isActive: true
  }
];

async function seed() {
  try {
    await client.connect();
    console.log('Connected to DB');

    // Clean existing products to avoid duplicates/confusion
    await client.query('DELETE FROM products');
    console.log('Cleared existing products');

    for (const product of products) {
      await client.query(
        'INSERT INTO products (name, description, base_price, price_per_km, capacity_liters, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())',
        [product.name, product.description, product.basePrice, product.pricePerKm, product.capacityLiters, product.isActive]
      );
      console.log(`Created: ${product.name}`);
    }

  } catch (err) {
    console.error('Error seeding:', err);
  } finally {
    await client.end();
  }
}

seed();
