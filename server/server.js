import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('dist'));

// Database connection
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'eshnasql',
  database: 'shopscape'
};

let db;

async function connectDB() {
  try {
    db = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL database');
  } catch (error) {
    console.error('Database connection failed:', error);
  }
}

connectDB();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// User registration
app.post('/api/register', async (req, res) => {
  try {
    const { name, username, email, password, phonenumber, dob, address } = req.body;

    // Check if user exists
    const [existingUsers] = await db.execute(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await db.execute(
      'INSERT INTO users (name, username, email, password, phonenumber, dob, address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, username, email, hashedPassword, phonenumber, dob, address]
    );

    res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const [users] = await db.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.UserID, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.UserID,
        name: user.name,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const { category, search, sortBy, minPrice, maxPrice } = req.query;
    
    let query = `
      SELECT p.*, c.Name as categoryName 
      FROM products p 
      LEFT JOIN categories c ON p.CategoryID = c.CategoryID 
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      query += ' AND c.Name = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (p.Name LIKE ? OR c.Name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (minPrice) {
      query += ' AND p.Price >= ?';
      params.push(minPrice);
    }

    if (maxPrice) {
      query += ' AND p.Price <= ?';
      params.push(maxPrice);
    }

    // Sorting
    if (sortBy === 'price_low') {
      query += ' ORDER BY p.Price ASC';
    } else if (sortBy === 'price_high') {
      query += ' ORDER BY p.Price DESC';
    } else if (sortBy === 'name') {
      query += ' ORDER BY p.Name ASC';
    } else {
      query += ' ORDER BY p.ProductID ASC';
    }

    const [products] = await db.execute(query, params);
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get categories
app.get('/api/categories', async (req, res) => {
  try {
    const [categories] = await db.execute('SELECT * FROM categories');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const [products] = await db.execute(
      'SELECT p.*, c.Name as categoryName FROM products p LEFT JOIN categories c ON p.CategoryID = c.CategoryID WHERE p.ProductID = ?',
      [req.params.id]
    );

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(products[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add to cart
app.post('/api/cart', authenticateToken, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user.userId;

    // Check if item already in cart
    const [existingItems] = await db.execute(
      'SELECT * FROM cart WHERE UserID = ? AND ProductID = ?',
      [userId, productId]
    );

    if (existingItems.length > 0) {
      // Update quantity
      await db.execute(
        'UPDATE cart SET Quantity = Quantity + ? WHERE UserID = ? AND ProductID = ?',
        [quantity, userId, productId]
      );
    } else {
      // Add new item
      await db.execute(
        'INSERT INTO cart (UserID, ProductID, Quantity) VALUES (?, ?, ?)',
        [userId, productId, quantity]
      );
    }

    res.json({ message: 'Item added to cart' });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get cart items
app.get('/api/cart', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const [cartItems] = await db.execute(`
      SELECT c.*, p.Name, p.Price, p.CategoryID,
             (c.Quantity * p.Price) as Total
      FROM cart c
      JOIN products p ON c.ProductID = p.ProductID
      WHERE c.UserID = ?
    `, [userId]);

    res.json(cartItems);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update cart item
app.put('/api/cart/:productId', authenticateToken, async (req, res) => {
  try {
    const { quantity } = req.body;
    const userId = req.user.userId;
    const productId = req.params.productId;

    if (quantity <= 0) {
      await db.execute(
        'DELETE FROM cart WHERE UserID = ? AND ProductID = ?',
        [userId, productId]
      );
    } else {
      await db.execute(
        'UPDATE cart SET Quantity = ? WHERE UserID = ? AND ProductID = ?',
        [quantity, userId, productId]
      );
    }

    res.json({ message: 'Cart updated' });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove from cart
app.delete('/api/cart/:productId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const productId = req.params.productId;

    await db.execute(
      'DELETE FROM cart WHERE UserID = ? AND ProductID = ?',
      [userId, productId]
    );

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add to wishlist
app.post('/api/wishlist', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.userId;

    // Check if already in wishlist
    const [existing] = await db.execute(
      'SELECT * FROM wishlist WHERE UserID = ? AND ProductID = ?',
      [userId, productId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Item already in wishlist' });
    }

    await db.execute(
      'INSERT INTO wishlist (UserID, ProductID) VALUES (?, ?)',
      [userId, productId]
    );

    res.json({ message: 'Item added to wishlist' });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get wishlist
app.get('/api/wishlist', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const [wishlistItems] = await db.execute(`
      SELECT w.*, p.Name, p.Price, p.CategoryID
      FROM wishlist w
      JOIN products p ON w.ProductID = p.ProductID
      WHERE w.UserID = ?
    `, [userId]);

    res.json(wishlistItems);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove from wishlist
app.delete('/api/wishlist/:productId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const productId = req.params.productId;

    await db.execute(
      'DELETE FROM wishlist WHERE UserID = ? AND ProductID = ?',
      [userId, productId]
    );

    res.json({ message: 'Item removed from wishlist' });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create order
app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { paymentMethod = 'online' } = req.body;

    // Get cart items
    const [cartItems] = await db.execute(`
      SELECT c.*, p.Price
      FROM cart c
      JOIN products p ON c.ProductID = p.ProductID
      WHERE c.UserID = ?
    `, [userId]);

    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Calculate total
    const totalAmount = cartItems.reduce((sum, item) => sum + (item.Price * item.Quantity), 0);

    // Create order
    const [orderResult] = await db.execute(
      'INSERT INTO orders (UserID, TotalAmount, PaymentMethod, Status) VALUES (?, ?, ?, ?)',
      [userId, totalAmount, paymentMethod, 'pending']
    );

    const orderId = orderResult.insertId;

    // Add order items
    for (const item of cartItems) {
      await db.execute(
        'INSERT INTO order_items (OrderID, ProductID, Quantity, Price) VALUES (?, ?, ?, ?)',
        [orderId, item.ProductID, item.Quantity, item.Price]
      );
    }

    // Clear cart
    await db.execute('DELETE FROM cart WHERE UserID = ?', [userId]);

    res.json({ 
      message: 'Order created successfully', 
      orderId,
      totalAmount 
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user orders
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const [orders] = await db.execute(`
      SELECT o.*, 
             GROUP_CONCAT(CONCAT(p.Name, ' (', oi.Quantity, ')') SEPARATOR ', ') as items
      FROM orders o
      LEFT JOIN order_items oi ON o.OrderID = oi.OrderID
      LEFT JOIN products p ON oi.ProductID = p.ProductID
      WHERE o.UserID = ?
      GROUP BY o.OrderID
      ORDER BY o.OrderDate DESC
    `, [userId]);

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});