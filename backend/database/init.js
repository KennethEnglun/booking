const { Pool } = require('pg');

// 創建資料庫連接池
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// 初始化資料庫表結構
async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    // 創建用戶表
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE,
        password_hash VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 創建預約表
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        venue VARCHAR(100) NOT NULL,
        booking_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        purpose TEXT,
        person_in_charge VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- 添加約束確保時間邏輯
        CONSTRAINT valid_time_range CHECK (end_time > start_time),
        CONSTRAINT future_date CHECK (booking_date >= CURRENT_DATE)
      )
    `);

    // 創建索引以提高查詢性能
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_venue_date ON bookings(venue, booking_date);
      CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
    `);

    // 創建觸發器自動更新 updated_at
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
      CREATE TRIGGER update_bookings_updated_at
        BEFORE UPDATE ON bookings
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    // 插入默認用戶（如果不存在）
    await client.query(`
      INSERT INTO users (username, email) 
      VALUES ('訪客', 'guest@example.com')
      ON CONFLICT (username) DO NOTHING
    `);

    console.log('資料庫表結構初始化完成');
  } catch (error) {
    console.error('資料庫初始化失敗:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 測試資料庫連接
async function testConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('資料庫連接成功');
    return true;
  } catch (error) {
    console.error('資料庫連接失敗:', error);
    return false;
  }
}

module.exports = {
  pool,
  initializeDatabase,
  testConnection
}; 