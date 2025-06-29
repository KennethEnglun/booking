const express = require('express');
const { pool } = require('../database/init');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

// 獲取當前用戶信息
router.get('/me', async (req, res) => {
  try {
    // 從請求頭獲取 token
    const authHeader = req.headers.authorization;
    let userId = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        userId = decoded.userId;
      } catch (error) {
        console.log('Token 驗證失敗:', error.message);
      }
    }

    if (userId) {
      // 如果有有效的 token，獲取用戶信息
      const query = 'SELECT id, username, email, created_at FROM users WHERE id = $1';
      const result = await pool.query(query, [userId]);
      
      if (result.rows.length > 0) {
        return res.json(result.rows[0]);
      }
    }

    // 如果沒有有效的 token 或用戶不存在，返回默認用戶
    const defaultUserQuery = "SELECT id, username, email, created_at FROM users WHERE username = '訪客'";
    const defaultResult = await pool.query(defaultUserQuery);
    
    if (defaultResult.rows.length > 0) {
      res.json(defaultResult.rows[0]);
    } else {
      res.json({
        id: 'default',
        username: '訪客',
        email: 'guest@example.com',
        created_at: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('獲取用戶信息失敗:', error);
    res.status(500).json({ error: '獲取用戶信息失敗' });
  }
});

// 用戶註冊
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 驗證必填欄位
    if (!username || !email || !password) {
      return res.status(400).json({ 
        error: '缺少必填欄位：用戶名、郵箱、密碼' 
      });
    }

    // 驗證密碼長度
    if (password.length < 6) {
      return res.status(400).json({ 
        error: '密碼長度至少需要 6 個字符' 
      });
    }

    // 檢查用戶名是否已存在
    const existingUserQuery = 'SELECT id FROM users WHERE username = $1 OR email = $2';
    const existingUserResult = await pool.query(existingUserQuery, [username, email]);
    
    if (existingUserResult.rows.length > 0) {
      return res.status(409).json({ 
        error: '用戶名或郵箱已存在' 
      });
    }

    // 加密密碼
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 創建用戶
    const insertQuery = `
      INSERT INTO users (username, email, password_hash) 
      VALUES ($1, $2, $3) 
      RETURNING id, username, email, created_at
    `;
    
    const result = await pool.query(insertQuery, [username, email, passwordHash]);

    // 生成 JWT token
    const token = jwt.sign(
      { userId: result.rows[0].id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      user: result.rows[0],
      token
    });
  } catch (error) {
    console.error('註冊失敗:', error);
    res.status(500).json({ error: '註冊失敗' });
  }
});

// 用戶登入
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 驗證必填欄位
    if (!username || !password) {
      return res.status(400).json({ 
        error: '缺少必填欄位：用戶名、密碼' 
      });
    }

    // 查找用戶
    const query = 'SELECT id, username, email, password_hash FROM users WHERE username = $1 OR email = $1';
    const result = await pool.query(query, [username]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ 
        error: '用戶名或密碼錯誤' 
      });
    }

    const user = result.rows[0];

    // 如果用戶沒有密碼（如訪客用戶），直接返回用戶信息
    if (!user.password_hash) {
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      return res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        },
        token
      });
    }

    // 驗證密碼
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: '用戶名或密碼錯誤' 
      });
    }

    // 生成 JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      token
    });
  } catch (error) {
    console.error('登入失敗:', error);
    res.status(500).json({ error: '登入失敗' });
  }
});

// 用戶登出
router.post('/logout', (req, res) => {
  // JWT 是無狀態的，客戶端需要刪除本地存儲的 token
  res.json({ message: '登出成功' });
});

// 驗證 token 中間件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '缺少認證 token' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: '無效的 token' });
    }
    req.user = user;
    next();
  });
};

// 受保護的路由示例
router.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: '這是受保護的資源', userId: req.user.userId });
});

module.exports = router; 