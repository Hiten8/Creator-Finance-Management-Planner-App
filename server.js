// server.js with automatic table creation
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection
  const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'creator_finance',
  password: process.env.DB_PASSWORD || 'your_password',
  port: process.env.DB_PORT || 5432,
});

// ============================================
// DATABASE INITIALIZATION - AUTO CREATE TABLES
// ============================================

const initializeDatabase = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Initializing database...');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Users table ready');

    // Create index on email
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);

    // Create transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        source VARCHAR(255) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense')),
        status VARCHAR(50) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled')),
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Transactions table ready');

    // Create indexes for transactions
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
      CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
      CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
    `);

    // Create platforms table
    await client.query(`
      CREATE TABLE IF NOT EXISTS platforms (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        platform_name VARCHAR(100) NOT NULL,
        revenue DECIMAL(10, 2) NOT NULL DEFAULT 0,
        month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
        year INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Platforms table ready');

    // Create indexes for platforms
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_platforms_user_id ON platforms(user_id);
      CREATE INDEX IF NOT EXISTS idx_platforms_date ON platforms(year, month);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_platforms_unique 
        ON platforms(user_id, platform_name, month, year);
    `);

    // Create monthly_stats table
    // await client.query(`
    //   CREATE TABLE IF NOT EXISTS monthly_stats (
    //     id SERIAL PRIMARY KEY,
    //     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    //     month VARCHAR(20) NOT NULL,
    //     year INTEGER NOT NULL,
    //     revenue DECIMAL(10, 2) DEFAULT 0,
    //     expenses DECIMAL(10, 2) DEFAULT 0,
    //     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    //     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    //   );
    // `);
    // console.log('Monthly stats table ready');

    // await client.query(`
    //   CREATE INDEX IF NOT EXISTS idx_monthly_stats_user_id ON monthly_stats(user_id);
    //   CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_stats_unique 
    //     ON monthly_stats(user_id, month, year);
    // `);

    // Create budgets table
    // await client.query(`
    //   CREATE TABLE IF NOT EXISTS budgets (
    //     id SERIAL PRIMARY KEY,
    //     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    //     category VARCHAR(100) NOT NULL,
    //     allocated_amount DECIMAL(10, 2) NOT NULL,
    //     spent_amount DECIMAL(10, 2) DEFAULT 0,
    //     month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    //     year INTEGER NOT NULL,
    //     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    //     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    //   );
    // `);
    // console.log('Budgets table ready');

    // await client.query(`
    //   CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
    // `);

    // Create update trigger function
    // await client.query(`
    //   CREATE OR REPLACE FUNCTION update_updated_at_column()
    //   RETURNS TRIGGER AS $$
    //   BEGIN
    //     NEW.updated_at = CURRENT_TIMESTAMP;
    //     RETURN NEW;
    //   END;
    //   $$ language 'plpgsql';
    // `);

    // Create triggers for all tables
    const tables = ['users', 'transactions', 'platforms'];
    for (const table of tables) {
      await client.query(`
        DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table};
        CREATE TRIGGER update_${table}_updated_at 
        BEFORE UPDATE ON ${table}
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `);
    }
    console.log('✅ Triggers created');

    console.log('✅ Database initialization complete!');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Test database connection and initialize
pool.connect(async (err, client, release) => {
  if (err) {
    console.error('❌ Error connecting to PostgreSQL:', err.stack);
    process.exit(1);
  }
  console.log('✅ Connected to PostgreSQL database');
  release();
  
  // Initialize database tables
  try {
    await initializeDatabase();
  } catch (error) {
    console.error('❌ Failed to initialize database');
    process.exit(1);
  }
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// ============================================
// AUTH ROUTES
// ============================================

// Register new user
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;

  // Validation
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  try {
    // Check if user already exists
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const result = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hashedPassword]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Create sample data for new user
    await createSampleData(user.id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Function to create sample data for new users
const createSampleData = async (userId) => {
  try {
    // Add sample transactions
    await pool.query(`
      INSERT INTO transactions (user_id, source, amount, type, date, status) VALUES
      ($1, 'YouTube Ad Revenue', 2450.00, 'income', CURRENT_DATE - INTERVAL '1 day', 'completed'),
      ($1, 'Patreon Subscription', 1890.00, 'income', CURRENT_DATE - INTERVAL '2 days', 'completed'),
      ($1, 'Video Equipment', 850.00, 'expense', CURRENT_DATE - INTERVAL '3 days', 'completed'),
      ($1, 'Twitch Donations', 567.50, 'income', CURRENT_DATE - INTERVAL '4 days', 'completed'),
      ($1, 'Software Subscription', 99.99, 'expense', CURRENT_DATE - INTERVAL '5 days', 'completed')
    `, [userId]);

    // Add sample platform data
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    await pool.query(`
      INSERT INTO platforms (user_id, platform_name, revenue, month, year) VALUES
      ($1, 'YouTube', 5000.00, $2, $3),
      ($1, 'Patreon', 3500.00, $2, $3),
      ($1, 'Twitch', 2000.00, $2, $3)
    `, [userId, currentMonth, currentYear]);

    console.log(`✅ Sample data created for user ${userId}`);
  } catch (error) {
    console.error('Error creating sample data:', error);
  }
};

// Login user
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// ============================================
// DASHBOARD DATA ROUTES
// ============================================

// Get user dashboard data
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    // Get user info
    const userResult = await pool.query(
      'SELECT name, email FROM users WHERE id = $1',
      [userId]
    );

    // Get total revenue
    const revenueResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total_revenue 
       FROM transactions 
       WHERE user_id = $1 AND type = 'income' AND status = 'completed'`,
      [userId]
    );

    // Get monthly revenue (current month)
    const monthlyRevenueResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as monthly_revenue 
       FROM transactions 
       WHERE user_id = $1 
       AND type = 'income' 
       AND status = 'completed'
       AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
       AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)`,
      [userId]
    );

    // Get total expenses (current month)
    const expensesResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total_expenses 
       FROM transactions 
       WHERE user_id = $1 
       AND type = 'expense' 
       AND status = 'completed'
       AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
       AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)`,
      [userId]
    );

    // Get revenue growth (compare with last month)
    const growthResult = await pool.query(
      `SELECT 
        COALESCE(
          (SELECT SUM(amount) FROM transactions 
           WHERE user_id = $1 AND type = 'income' AND status = 'completed'
           AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
           AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
          ), 0
        ) as current_month,
        COALESCE(
          (SELECT SUM(amount) FROM transactions 
           WHERE user_id = $1 AND type = 'income' AND status = 'completed'
           AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE) - 1
           AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
          ), 0
        ) as last_month`,
      [userId]
    );

    const currentMonth = parseFloat(growthResult.rows[0].current_month);
    const lastMonth = parseFloat(growthResult.rows[0].last_month);
    const revenueGrowth = lastMonth > 0 
      ? ((currentMonth - lastMonth) / lastMonth * 100).toFixed(1)
      : 0;

    res.json({
      name: userResult.rows[0].name,
      email: userResult.rows[0].email,
      totalRevenue: parseFloat(revenueResult.rows[0].total_revenue),
      monthlyRevenue: parseFloat(monthlyRevenueResult.rows[0].monthly_revenue),
      expenses: parseFloat(expensesResult.rows[0].total_expenses),
      revenueGrowth: parseFloat(revenueGrowth),
      subscribers: 0
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
});

// Get platform revenue distribution
app.get('/api/platforms', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT platform_name as name, SUM(revenue) as value
       FROM platforms
       WHERE user_id = $1
       AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
       AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
       GROUP BY platform_name`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Platform data error:', error);
    res.status(500).json({ message: 'Error fetching platform data' });
  }
});

// Get monthly trend data
app.get('/api/monthly-trend', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT 
        TO_CHAR(date, 'Mon') as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as revenue,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
       FROM transactions
       WHERE user_id = $1 
       AND status = 'completed'
       AND date >= CURRENT_DATE - INTERVAL '6 months'
       GROUP BY TO_CHAR(date, 'Mon'), EXTRACT(MONTH FROM date)
       ORDER BY EXTRACT(MONTH FROM date)`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Monthly trend error:', error);
    res.status(500).json({ message: 'Error fetching monthly trend' });
  }
});

// Get recent transactions
app.get('/api/transactions', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const limit = req.query.limit || 10;

  try {
    const result = await pool.query(
      `SELECT id, source, amount, date, type, status
       FROM transactions
       WHERE user_id = $1
       ORDER BY date DESC
       LIMIT $2`,
      [userId, limit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Transactions error:', error);
    res.status(500).json({ message: 'Error fetching transactions' });
  }
});

// Add new transaction
app.post('/api/transactions', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { source, amount, type, date, status } = req.body;

  if (!source || !amount || !type) {
    return res.status(400).json({ message: 'Source, amount, and type are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO transactions (user_id, source, amount, type, date, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, source, amount, type, date || new Date(), status || 'completed']
    );

    res.status(201).json({
      message: 'Transaction added successfully',
      transaction: result.rows[0]
    });
  } catch (error) {
    console.error('Add transaction error:', error);
    res.status(500).json({ message: 'Error adding transaction' });
  }
});

// Update transaction
app.put('/api/transactions/:id', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const transactionId = req.params.id;
  const { source, amount, type, date, status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE transactions 
       SET source = $1, amount = $2, type = $3, date = $4, status = $5
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [source, amount, type, date, status, transactionId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json({
      message: 'Transaction updated successfully',
      transaction: result.rows[0]
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ message: 'Error updating transaction' });
  }
});

// Delete transaction
app.delete('/api/transactions/:id', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const transactionId = req.params.id;

  try {
    const result = await pool.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING *',
      [transactionId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ message: 'Error deleting transaction' });
  }
});

// Add platform revenue
app.post('/api/platforms', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { platform_name, revenue, month, year } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO platforms (user_id, platform_name, revenue, month, year)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, platform_name, month, year) 
       DO UPDATE SET revenue = platforms.revenue + EXCLUDED.revenue
       RETURNING *`,
      [userId, platform_name, revenue, month || new Date().getMonth() + 1, year || new Date().getFullYear()]
    );

    res.status(201).json({
      message: 'Platform revenue added successfully',
      platform: result.rows[0]
    });
  } catch (error) {
    console.error('Add platform error:', error);
    res.status(500).json({ message: 'Error adding platform revenue' });
  }
});

// Get user profile
app.get('/api/profile', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Ready to accept requests`);
});